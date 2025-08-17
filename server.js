import yahooFinance from 'yahoo-finance2';
import express from 'express';
import pkg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());

//Database connection 
const { Pool } = pkg;
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});
// Database Connection Test 
pool.query("SELECT NOW()", (err, res) => {
    if (err) {
        console.error(" Connection error:", err);
    } else {
        console.log(" DB connected successfully");
    }
});

// API to get all companies
app.get("/api/companies", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM companies ORDER BY name");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

//  Current Quote 
app.get('/api/stock', async (req, res) => {
    try {
        const { stock } = req.query;
        if (!stock) {
            return res.status(400).send({ error: 'Stock symbol is required' });
        }
        const result = await yahooFinance.quote(stock);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch stock data' });
    }
});

// Historical Data 
app.get('/api/stock/history', async (req, res) => {
    try {
        const { stock } = req.query;
        if (!stock) {
            return res.status(400).json({ error: 'Stock symbol is required' });
        }

        const today = new Date();

        // ---------- Yearly Data (1 year, 1d interval) ----------
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);

        const yearly = await yahooFinance.chart(stock, {
            period1: oneYearAgo.toISOString().split("T")[0],
            period2: today.toISOString().split("T")[0],
            interval: "1d",
        });

        const yearlyQuotes = yearly?.quotes || [];
        if (!yearlyQuotes.length) {
            return res.status(500).json({ error: "No historical data available" });
        }

        const yearlyFormatted = yearlyQuotes.map(q => ({
            date: new Date(q.date),
            open: q.open,
            high: q.high,
            low: q.low,
            close: q.close,
            volume: q.volume,
        }));

        // ---------- Monthly Data (last 30 days, 1d interval) ----------
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(today.getDate() - 30);

        const monthly = await yahooFinance.chart(stock, {
            period1: oneMonthAgo.toISOString().split("T")[0],
            period2: today.toISOString().split("T")[0],
            interval: "1d",
        });

        const monthlyQuotes = monthly?.quotes || [];
        const monthlyFormatted = monthlyQuotes.map(q => ({
            date: new Date(q.date),
            open: q.open,
            high: q.high,
            low: q.low,
            close: q.close,
            volume: q.volume,
        }));

        // ---------- Weekly Data (last 7 days, 1d interval) ----------
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);

        const weekly = await yahooFinance.chart(stock, {
            period1: Math.floor(lastWeek.getTime() / 1000),  // 7 days ago
            period2: Math.floor(today.getTime() / 1000),    // today
            interval: "1d",
        });

        const weeklyQuotes = weekly?.quotes || [];
        const weeklyFormatted = weeklyQuotes.map(q => ({
            date: new Date(q.date),
            open: q.open,
            high: q.high,
            low: q.low,
            close: q.close,
            volume: q.volume,
        }));

        // ---------- Final Response ----------
        res.json({
            yearly: yearlyFormatted,
            monthly: monthlyFormatted,
            weekly: weeklyFormatted,
        });

    } catch (error) {
        console.error("Yahoo API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Stats (Yearly High/Low)
app.get('/api/stock/stats', async (req, res) => {
    try {
        const { stock } = req.query;
        if (!stock) {
            return res.status(400).json({ error: 'Stock symbol is required' });
        }

        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);

        const yearly = await yahooFinance.chart(stock, {
            period1: oneYearAgo.toISOString().split("T")[0],
            period2: today.toISOString().split("T")[0],
            interval: "1d",
        });

        const yearlyQuotes = yearly?.quotes || [];
        if (!yearlyQuotes.length) {
            return res.status(500).json({ error: "No historical data available" });
        }

        let max = { price: -Infinity, date: null };
        let min = { price: Infinity, date: null };

        for (const q of yearlyQuotes) {
            if (q.high > max.price) {
                max.price = q.high;
                max.date = new Date(q.date);
            }
            if (q.low < min.price) {
                min.price = q.low;
                min.date = new Date(q.date);
            }
        }

        res.json({ max, min });

    } catch (error) {
        console.error("Yahoo API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

//  Start Server 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
