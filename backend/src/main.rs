use rusqlite::Connection;
use std::collections::hash_map::DefaultHasher;
use std::env;
use std::hash::{Hash, Hasher};

// App, HttpResponse, HttpServer
use actix_web::{web, web::Data, App, HttpResponse, HttpServer};
use serde::{Deserialize, Serialize};
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
struct CreateUserRequest {
    username: String,
    password: String,
}

#[derive(Serialize, Deserialize)]
struct SessionToken {
    uuid: Uuid,
}

async fn create_account(
    server_data: web::Data<ServerData>,
    request: web::Json<CreateUserRequest>,
) -> HttpResponse {
    if request.username.len() > 31 || request.password.len() > 31 {
        // enforcing frontend constraints also at the backend
        return HttpResponse::PayloadTooLarge().finish();
    }

    let conn = &mut server_data.conn.lock().unwrap();
    let password_hash = get_password_hash(&request.password);
    conn.execute(
        "INSERT OR IGNORE INTO user_auth (username, password_hash, session_token) VALUES (?, ?, ?)",
        (
            request.username.as_str(),
            password_hash,
            uuid::Uuid::new_v4().to_string(),
        ),
    )
    .unwrap();

    let changes = conn.changes();
    match changes {
        0 => HttpResponse::Conflict(),
        1 => HttpResponse::Created(),
        _ => HttpResponse::InternalServerError(),
    }
    .finish()
}

async fn login(
    server_data: web::Data<ServerData>,
    request: web::Json<CreateUserRequest>,
) -> HttpResponse {
    let conn = &mut server_data.conn.lock().unwrap();
    let password_hash = get_password_hash(&request.password);

    HttpResponse::Ok().finish() // todo
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

    let db_connection = ServerData {
        conn: Mutex::new(conn),
    };
    let server_data = Data::new(db_connection);

    HttpServer::new(move || {
        App::new()
            .app_data(server_data.clone())
            .route("/create_account", web::post().to(create_account))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
