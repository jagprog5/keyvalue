use rusqlite::Connection;
use std::collections::hash_map::DefaultHasher;
use std::env;
use std::hash::{Hash, Hasher};

// App, HttpResponse, HttpServer
use actix_web::{post, web, web::Data, App, HttpResponse, HttpServer};
use serde::Deserialize;
use std::sync::Mutex;
use uuid::Uuid;

fn get_password_hash(pass: &str) -> i64 {
    let mut hasher = DefaultHasher::new();
    "bVWAj".hash(&mut hasher); // salt
    pass.hash(&mut hasher);
    hasher.finish() as i64 // sqlite int type
}

struct ServerData {
    conn: Mutex<Connection>,
}

#[derive(Deserialize)]
struct UserRequest {
    username: String,
    password: String,
}

type SessionToken = Uuid;

#[derive(Deserialize)]
struct GetValueRequest {
    username: String,
    session_token: SessionToken,
    key: String,
}

#[derive(Deserialize)]
struct SetValueRequest {
    username: String,
    session_token: SessionToken,
    key: String,
    value: String,
}

// if the username does not already exist,
// then insert a new user, and return a session token (logged in)
#[post("/create-account")]
async fn create_account(
    server_data: web::Data<ServerData>,
    request: web::Json<UserRequest>,
) -> HttpResponse {
    if request.username.len() > 32 || request.password.len() > 32 {
        // enforcing frontend constraints also at the backend
        return HttpResponse::PayloadTooLarge().finish();
    }

    let password_hash = get_password_hash(&request.password);
    let session_token = uuid::Uuid::new_v4().to_string();
    let conn = &mut server_data.conn.lock().unwrap();
    let mut stmt = conn
        .prepare_cached("
            INSERT OR IGNORE INTO user_auth (username, password_hash, session_token)
            VALUES (?, ?, ?)"
        ).unwrap();
    match stmt.execute((
        request.username.as_str(),
        password_hash,
        session_token.as_str(),
    )) {
        Err(_) => HttpResponse::InternalServerError().finish(),
        Ok(changes) => match changes {
            0 => HttpResponse::Conflict().finish(),
            1 => HttpResponse::Ok().body(session_token),
            _ => HttpResponse::InternalServerError().finish(),
        },
    }
}

// check if the username and password hash combination exist
// if it does, then set and return a session token, and update the timestamp
#[post("/login")]
async fn login(
    server_data: web::Data<ServerData>,
    request: web::Json<UserRequest>,
) -> HttpResponse {
    if request.username.len() > 32 || request.password.len() > 32 {
        return HttpResponse::PayloadTooLarge().finish();
    }

    let password_hash = get_password_hash(&request.password);
    let session_token_string = uuid::Uuid::new_v4().to_string();
    let conn = &mut server_data.conn.lock().unwrap();
    let mut stmt = conn
        .prepare_cached(
            "UPDATE user_auth
            SET session_token = ?, timestamp = CURRENT_TIMESTAMP
            WHERE username = ? AND password_hash = ?
        ").unwrap();
    match stmt.execute((
        session_token_string.as_str(),
        request.username.as_str(),
        password_hash,
    )) {
        Err(_) => HttpResponse::InternalServerError().finish(),
        Ok(changes) => match changes {
            0 => HttpResponse::BadRequest().finish(),
            1 => HttpResponse::Ok().content_type("text/plain").body(session_token_string),
            _ => HttpResponse::InternalServerError().finish(),
        },
    }
}

// if the session is valid, then returns true and update the timestamp
fn is_session_valid(
    conn: &mut Connection,
    username: &str,
    session_token: &SessionToken,
) -> Result<bool, rusqlite::Error> {
    let mut stmt = conn.prepare_cached("
        UPDATE user_auth
        SET timestamp = CURRENT_TIMESTAMP
        WHERE username = ? AND session_token = ?
    ").unwrap();
    match stmt.execute((
        username,
        session_token.to_string(),
    )) {
        Err(e) => Err(e),
        Ok(changes) => match changes {
            0 => Ok(false),
            1 => Ok(true),
            // will never happen. some simple error type
            _ => Err(rusqlite::Error::QueryReturnedNoRows),
        },
    }
}

// checks session validity, then inserts or replaces the appropriate key, updating the timestamps
#[post("/set-value")]
async fn set_value(
    server_data: web::Data<ServerData>,
    request: web::Json<SetValueRequest>,
) -> HttpResponse {
    // deserialization of UUID already performed length check on session token
    if request.username.len() > 32 || request.key.len() > 32 || request.value.len() > 32 {
        return HttpResponse::PayloadTooLarge().finish();
    }
    let conn = &mut server_data.conn.lock().unwrap();

    match is_session_valid(conn, &request.username, &request.session_token) {
        Err(_) => HttpResponse::InternalServerError().finish(),
        Ok(false) => HttpResponse::BadRequest().finish(),
        Ok(true) => {
            let mut stmt = conn
                // this refreshes the timestamp as well
                .prepare_cached("
                    INSERT OR REPLACE INTO key_values (username, key, value)
                    VALUES(?, ?, ?)
                ")
                .unwrap();
            match stmt.execute((
                request.username.as_str(),
                request.key.as_str(),
                request.value.as_str(),
            )) {
                Err(_) => HttpResponse::InternalServerError().finish(),
                Ok(_) => HttpResponse::Ok().finish(),
            }
        }
    }
}

// checks session validity, returns the appropriate value, updating the timestamps
#[post("/get-value")]
async fn get_value(
    server_data: web::Data<ServerData>,
    request: web::Json<GetValueRequest>,
) -> HttpResponse {
    // deserialization of UUID already performed length check on session token
    if request.username.len() > 32 || request.key.len() > 32 {
        return HttpResponse::PayloadTooLarge().finish();
    }
    let conn = &mut server_data.conn.lock().unwrap();
    match is_session_valid(conn, &request.username, &request.session_token) {
        Err(_) => HttpResponse::InternalServerError().finish(),
        Ok(false) => HttpResponse::BadRequest().finish(),
        Ok(true) => {
            let mut stmt = conn.prepare_cached("
                UPDATE key_values
                SET timestamp = CURRENT_TIMESTAMP
                WHERE username = ? and key = ?
                RETURNING value
            ").unwrap();
            match stmt.query_row((request.username.as_str(), request.key.as_str()), |row| {
                Ok(row.get::<usize, String>(0).unwrap())
            }) {
                Err(rusqlite::Error::QueryReturnedNoRows) => HttpResponse::NotFound().finish(),
                Err(_) => HttpResponse::InternalServerError().finish(),
                Ok(val) => HttpResponse::Ok().content_type("text/plain").body(val),
            }
        }
    }
}

async fn dropper(server_data: Data<ServerData>) {
    use tokio::time::{self, Duration};
    let mut interval = time::interval(Duration::from_secs(60));
    loop {
        interval.tick().await;
        let conn = &mut server_data.conn.lock().unwrap();
        let mut stmt = conn.prepare_cached("
        DELETE FROM user_auth WHERE timestamp <= datetime('now', '-1 hours');
        DELETE FROM key_values WHERE timestamp <= datetime('now', '-1 hours');
        ").unwrap();
        stmt.execute(()).unwrap();
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let default_db_path = "/db/db.db".to_owned();
    let db_path = match env::var("DB_PATH") {
        Ok(a) => a,
        Err(e) => match e {
            env::VarError::NotPresent => default_db_path,
            env::VarError::NotUnicode(_) => panic!("Not unicode DB_PATH env: {}", e),
        },
    };

    let open_result = Connection::open(db_path);

    let conn = match open_result {
        Ok(a) => a,
        Err(_) => panic!("Unable to open db. Consider setting DB_PATH env."),
    };

    // init
    conn.execute(
        "CREATE TABLE IF NOT EXISTS user_auth (
            username TEXT PRIMARY KEY NOT NULL,
            password_hash INTEGER,
            session_token TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        ) WITHOUT ROWID;",
        (),
    )
    .unwrap();

    conn.execute(
        "CREATE TABLE IF NOT EXISTS key_values (
            username TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY (username, key)
        ) WITHOUT ROWID;",
        (),
    )
    .unwrap();

    // 6 prepared queries: create account, login, get, set, validate_session_token, dropper
    conn.set_prepared_statement_cache_capacity(6);

    let db_connection = ServerData {
        conn: Mutex::new(conn),
    };
    let server_data = Data::new(db_connection);

    tokio::spawn(dropper(server_data.clone()));

    HttpServer::new(move || {
        App::new()
            .app_data(server_data.clone())
            .service(login)
            .service(create_account)
            .service(set_value)
            .service(get_value)
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
