use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::env;
use rusqlite::Connection;

fn get_password_hash(pass: &str) -> i64 {
    let mut hasher = DefaultHasher::new();
    "bVWAj".hash(&mut hasher); // salt
    pass.hash(&mut hasher);
    hasher.finish() as i64 // cast to sqlite int type
}

fn main() {
    // db_path points in the docker volume by default, unless overriden by DB_PATH, for dev convenience
    let db_path = env::var("DB_PATH").unwrap_or("/db/db.db".to_string());
    let conn = Connection::open(db_path).unwrap();

    conn.execute(
        "CREATE TABLE IF NOT EXISTS key_values (
            username VARCHAR(32) NOT NULL,
            pass_hash INTEGER,
            key VARCHAR(32) NOT NULL,
            value VARCHAR(32) NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY (username, pass_hash, key),
            UNIQUE (username, pass_hash, key, value)
        ) WITHOUT ROWID;",
        ()
    ).unwrap();

    println!("good");


}
