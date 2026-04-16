#!/usr/bin/env python3
"""CLI script to create the first admin user."""
import os
import sys

# Ensure we can import project modules
sys.path.insert(0, os.path.dirname(__file__))

from database import get_connection, init_db
from auth import hash_password


def main():
    init_db()
    username = input("Admin username: ").strip()
    if not username:
        print("Username cannot be empty.")
        sys.exit(1)
    password = input("Admin password: ").strip()
    if not password:
        print("Password cannot be empty.")
        sys.exit(1)

    hashed = hash_password(password)
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO users (username, hashed_password, role) VALUES (%s, %s, 'admin')",
                    (username, hashed),
                )
            conn.commit()
        print(f"Admin user '{username}' created successfully.")
    except Exception as e:
        if "unique" in str(e).lower():
            print(f"User '{username}' already exists.")
        else:
            print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
