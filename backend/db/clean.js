import pool from './pool.js';

async function cleanData() {
    console.log('🧹 Starting database cleanup...');
    
    // Tables to clear (operational data only)
    const tables = [
        'assignments',
        'sheets',
        'jobs',
        'film_sizes',
        'vendor_film_sizes'
    ];

    try {
        const query = `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE;`;
        await pool.query(query);
        console.log('✅ Success: All operational data has been deleted.');
        console.log('ℹ️  Login credentials (companies, users, vendors) were preserved.');
    } catch (err) {
        console.error('❌ Error during cleanup:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

cleanData();
