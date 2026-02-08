"""
Database connection and utilities for FastAPI backend.
"""
import os
from typing import Optional
import mysql.connector
from mysql.connector import pooling
from contextlib import contextmanager

# Database configuration from environment
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "rockr"),
}

# Connection pool
connection_pool: Optional[pooling.MySQLConnectionPool] = None


def init_db_pool():
    """Initialize database connection pool."""
    global connection_pool
    if connection_pool is None:
        connection_pool = pooling.MySQLConnectionPool(
            pool_name="fastapi_pool",
            pool_size=5,
            pool_reset_session=True,
            **DB_CONFIG
        )
    return connection_pool


@contextmanager
def get_db_connection():
    """
    Context manager for database connections.
    Automatically handles connection cleanup.
    """
    if connection_pool is None:
        init_db_pool()
    
    conn = connection_pool.get_connection()
    try:
        yield conn
    finally:
        conn.close()


@contextmanager
def get_db_cursor(dictionary=True):
    """
    Context manager for database cursor.
    
    Args:
        dictionary: If True, returns rows as dictionaries
    """
    with get_db_connection() as conn:
        cursor = conn.cursor(dictionary=dictionary)
        try:
            yield cursor
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
