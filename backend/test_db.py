from app.database import test_db_connection, engine
from sqlalchemy import text

print('Testing database connection...')
result = test_db_connection()
print(f'Connection test result: {result}')

with engine.connect() as conn:
    result = conn.execute(text('SELECT VERSION()'))
    version = result.fetchone()
    print(f'MySQL Version: {version[0]}')
    
    result = conn.execute(text('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = "scanandgo_prod"'))
    count = result.fetchone()
    print(f'Total tables in scanandgo_prod: {count[0]}')
    
    result = conn.execute(text('SHOW TABLES'))
    tables = result.fetchall()
    print(f'\nTables:')
    for table in tables:
        print(f'  - {table[0]}')
