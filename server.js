// Godown Dashboard - Express Server with Supabase
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== EMPLOYEES API =====
app.get('/api/employees', async (req, res) => {
    try {
        const { data, error } = await supabase.from('employees').select('*').order('name');
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/employees/active', async (req, res) => {
    try {
        const { data, error } = await supabase.from('employees').select('*').eq('active', true).order('name');
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/employees', async (req, res) => {
    try {
        const { data, error } = await supabase.from('employees').insert([{ name: req.body.name, active: true }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/employees/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('employees')
            .update({ name: req.body.name, active: req.body.active, updated_at: new Date().toISOString() })
            .eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/employees/:id/toggle', async (req, res) => {
    try {
        const { data: current } = await supabase.from('employees').select('active').eq('id', req.params.id).single();
        const { data, error } = await supabase.from('employees')
            .update({ active: !current.active, updated_at: new Date().toISOString() })
            .eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ===== WORK TYPES API =====
app.get('/api/work-types', async (req, res) => {
    try {
        const { data, error } = await supabase.from('work_types').select('*').order('name');
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/work-types', async (req, res) => {
    try {
        const { data, error } = await supabase.from('work_types').insert([{ name: req.body.name }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/work-types/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('work_types').update({ name: req.body.name }).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/work-types/:id', async (req, res) => {
    try {
        await supabase.from('work_types').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ===== PRODUCTS API =====
app.get('/api/products', async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').select('*').order('name');
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/products', async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').insert([{ name: req.body.name }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').update({ name: req.body.name }).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await supabase.from('products').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ===== UNITS API =====
app.get('/api/units', async (req, res) => {
    try {
        const { data, error } = await supabase.from('units').select('*').order('name');
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/units', async (req, res) => {
    try {
        const { data, error } = await supabase.from('units').insert([{ name: req.body.name }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/units/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('units').update({ name: req.body.name }).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/units/:id', async (req, res) => {
    try {
        await supabase.from('units').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ===== WORK ENTRIES API =====
app.get('/api/work-entries', async (req, res) => {
    try {
        const { data, error } = await supabase.from('work_entries')
            .select(`*, employee:employees(id, name), work_type:work_types(id, name), product:products(id, name), unit:units(id, name)`)
            .order('start_time', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/work-entries', async (req, res) => {
    try {
        const { employee_id, work_type_id, product_id, unit_id, target_quantity } = req.body;
        const { data, error } = await supabase.from('work_entries')
            .insert([{ employee_id, work_type_id, product_id, unit_id, target_quantity, status: 'in-progress', start_time: new Date().toISOString() }])
            .select(`*, employee:employees(id, name), work_type:work_types(id, name), product:products(id, name), unit:units(id, name)`)
            .single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/work-entries/:id/complete', async (req, res) => {
    try {
        const { actual_quantity, notes } = req.body;
        const { data, error } = await supabase.from('work_entries')
            .update({ actual_quantity, notes, status: 'complete', end_time: new Date().toISOString() })
            .eq('id', req.params.id)
            .select(`*, employee:employees(id, name), work_type:work_types(id, name), product:products(id, name), unit:units(id, name)`)
            .single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/work-entries/:id', async (req, res) => {
    try {
        const { actual_quantity, notes, status } = req.body;
        const { data, error } = await supabase.from('work_entries')
            .update({ actual_quantity, notes, status })
            .eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/work-entries/:id', async (req, res) => {
    try {
        await supabase.from('work_entries').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ===== ANALYTICS API =====
app.get('/api/analytics/productivity', async (req, res) => {
    try {
        const [entriesRes, employeesRes] = await Promise.all([
            supabase.from('work_entries').select('*'),
            supabase.from('employees').select('*').eq('active', true)
        ]);
        if (entriesRes.error) throw entriesRes.error;
        if (employeesRes.error) throw employeesRes.error;

        const entries = entriesRes.data;
        const employees = employeesRes.data;
        const completed = entries.filter(e => e.status === 'complete');
        const inProgress = entries.filter(e => e.status === 'in-progress');
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const thisWeek = completed.filter(e => new Date(e.start_time) >= weekAgo);
        const totalUnits = completed.reduce((s, e) => s + (e.actual_quantity || 0), 0);
        const avgEff = completed.length > 0 ? Math.round(completed.reduce((s, e) => s + ((e.actual_quantity / e.target_quantity) * 100), 0) / completed.length) : 0;

        const employeeStats = employees.map(emp => {
            const empEntries = completed.filter(e => e.employee_id === emp.id);
            const tasks = empEntries.length;
            const produced = empEntries.reduce((s, e) => s + (e.actual_quantity || 0), 0);
            const eff = tasks > 0 ? Math.round(empEntries.reduce((s, e) => s + ((e.actual_quantity / e.target_quantity) * 100), 0) / tasks) : 0;
            return { ...emp, totalTasks: tasks, totalProduced: produced, avgEfficiency: eff };
        }).sort((a, b) => b.avgEfficiency - a.avgEfficiency);

        res.json({
            totalEmployees: employees.length,
            totalCompleted: completed.length,
            inProgress: inProgress.length,
            thisWeekCompleted: thisWeek.length,
            totalUnits,
            avgEfficiency: avgEff,
            completionRate: entries.length > 0 ? Math.round((completed.length / entries.length) * 100) : 0,
            employeeStats
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ===== DAILY REPORTS API =====
app.get('/api/analytics/daily-report', async (req, res) => {
    try {
        const { period } = req.query;
        const now = new Date();
        let startDate;

        if (period === 'week') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === 'month') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else {
            startDate = new Date(now.setHours(0, 0, 0, 0));
        }

        const [entriesRes, employeesRes, productsRes, workTypesRes] = await Promise.all([
            supabase.from('work_entries')
                .select(`*, employee:employees(id, name), product:products(id, name), work_type:work_types(id,name)`)
                .gte('start_time', startDate.toISOString())
                .eq('status', 'complete'),
            supabase.from('employees').select('*').eq('active', true),
            supabase.from('products').select('*'),
            supabase.from('work_types').select('*')
        ]);

        if (entriesRes.error) throw entriesRes.error;
        const entries = entriesRes.data;
        const employees = employeesRes.data || [];
        const products = productsRes.data || [];
        const workTypes = workTypesRes.data || [];

        // Group by date
        const dailyData = {};
        entries.forEach(entry => {
            const date = new Date(entry.start_time).toISOString().split('T')[0];
            if (!dailyData[date]) dailyData[date] = { totalWork: 0, entries: [] };
            dailyData[date].totalWork += entry.actual_quantity || 0;
            dailyData[date].entries.push(entry);
        });

        // Calculate final product count per date (minimum across work types for each product)
        Object.keys(dailyData).forEach(date => {
            const dayEntries = dailyData[date].entries;
            const productWorkTypes = {};

            // Group by product, then by work type
            dayEntries.forEach(e => {
                if (!e.product_id) return;
                if (!productWorkTypes[e.product_id]) productWorkTypes[e.product_id] = {};
                if (!productWorkTypes[e.product_id][e.work_type_id]) {
                    productWorkTypes[e.product_id][e.work_type_id] = 0;
                }
                productWorkTypes[e.product_id][e.work_type_id] += e.actual_quantity || 0;
            });

            // Final product count = minimum across work types (bottleneck)
            let finalProducts = 0;
            Object.values(productWorkTypes).forEach(workTypeQtys => {
                const qtys = Object.values(workTypeQtys);
                if (qtys.length > 0) {
                    finalProducts += Math.min(...qtys);
                }
            });
            dailyData[date].finalProducts = finalProducts;
        });

        // Employee breakdown (total work done, not final products)
        const employeeBreakdown = employees.map(emp => {
            const empEntries = entries.filter(e => e.employee_id === emp.id);
            const total = empEntries.reduce((s, e) => s + (e.actual_quantity || 0), 0);
            return { id: emp.id, name: emp.name, totalWork: total, tasks: empEntries.length };
        }).filter(e => e.tasks > 0).sort((a, b) => b.totalWork - a.totalWork);

        // Work type breakdown
        const workTypeBreakdown = workTypes.map(wt => {
            const wtEntries = entries.filter(e => e.work_type_id === wt.id);
            const total = wtEntries.reduce((s, e) => s + (e.actual_quantity || 0), 0);
            return { id: wt.id, name: wt.name, totalDone: total, tasks: wtEntries.length };
        }).filter(w => w.tasks > 0).sort((a, b) => b.totalDone - a.totalDone);

        // Calculate overall final product count (minimum across work types per product)
        const productWorkTypes = {};
        entries.forEach(e => {
            if (!e.product_id) return;
            if (!productWorkTypes[e.product_id]) productWorkTypes[e.product_id] = { name: e.product?.name, workTypes: {} };
            if (!productWorkTypes[e.product_id].workTypes[e.work_type_id]) {
                productWorkTypes[e.product_id].workTypes[e.work_type_id] = 0;
            }
            productWorkTypes[e.product_id].workTypes[e.work_type_id] += e.actual_quantity || 0;
        });

        let totalFinalProducts = 0;
        const productBreakdown = Object.entries(productWorkTypes).map(([prodId, data]) => {
            const qtys = Object.values(data.workTypes);
            const finalCount = qtys.length > 0 ? Math.min(...qtys) : 0;
            totalFinalProducts += finalCount;
            return { id: prodId, name: data.name, finalCount, workStages: Object.keys(data.workTypes).length };
        }).sort((a, b) => b.finalCount - a.finalCount);

        const totalWork = entries.reduce((s, e) => s + (e.actual_quantity || 0), 0);

        res.json({
            period,
            startDate: startDate.toISOString(),
            totalWork,
            totalFinalProducts,
            totalTasks: entries.length,
            dailyData: Object.entries(dailyData).map(([date, data]) => ({
                date,
                totalWork: data.totalWork,
                finalProducts: data.finalProducts,
                tasks: data.entries.length
            })).sort((a, b) => b.date.localeCompare(a.date)),
            employeeBreakdown,
            workTypeBreakdown,
            productBreakdown,
            entries
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});


// ===== EXPENSE CATEGORIES API =====
app.get('/api/expense-categories', async (req, res) => {
    try {
        const { data, error } = await supabase.from('expense_categories').select('*').order('name');
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/expense-categories', async (req, res) => {
    try {
        const { data, error } = await supabase.from('expense_categories').insert([{ name: req.body.name }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/expense-categories/:id', async (req, res) => {
    try {
        await supabase.from('expense_categories').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ===== EXPENSES API =====
app.get('/api/expenses', async (req, res) => {
    try {
        const { data, error } = await supabase.from('expenses')
            .select(`*, category:expense_categories(id, name)`)
            .order('expense_date', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/expenses', async (req, res) => {
    try {
        const { item_name, amount, category_id, expense_date, receipt_url, is_replacement, replacement_reason, original_expense_id, notes } = req.body;
        const { data, error } = await supabase.from('expenses')
            .insert([{ item_name, amount, category_id, expense_date, receipt_url, is_replacement: is_replacement || false, replacement_reason, original_expense_id, notes, status: 'active' }])
            .select(`*, category:expense_categories(id, name)`).single();
        if (error) throw error;
        if (is_replacement && original_expense_id) {
            await supabase.from('expenses').update({ status: 'replaced' }).eq('id', original_expense_id);
        }
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/expenses/:id', async (req, res) => {
    try {
        const updates = { ...req.body, updated_at: new Date().toISOString() };
        const { data, error } = await supabase.from('expenses').update(updates).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/expenses/:id', async (req, res) => {
    try {
        await supabase.from('expenses').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/expenses/:id/status', async (req, res) => {
    try {
        const { data, error } = await supabase.from('expenses')
            .update({ status: req.body.status, updated_at: new Date().toISOString() })
            .eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ===== SETTINGS API =====
app.get('/api/settings', async (req, res) => {
    try {
        const { data, error } = await supabase.from('settings').select('*');
        if (error) throw error;
        const settings = {};
        data.forEach(item => { settings[item.key] = item.value; });
        res.json(settings);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/settings', async (req, res) => {
    try {
        for (const [key, value] of Object.entries(req.body)) {
            await supabase.from('settings').upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });
        }
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ===== DATA SOURCES API =====
// Get all data sources
app.get('/api/data-sources', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('data_sources')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Add new data source
app.post('/api/data-sources', async (req, res) => {
    try {
        const { name, sheet_url, sheet_type = 'sales' } = req.body;
        if (!name || !sheet_url) throw new Error('Name and sheet URL are required');

        const { data, error } = await supabase
            .from('data_sources')
            .insert([{ name, sheet_url, sheet_type, status: 'pending' }])
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Update data source
app.put('/api/data-sources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body, updated_at: new Date().toISOString() };
        const { data, error } = await supabase
            .from('data_sources')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Delete data source
app.delete('/api/data-sources/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('data_sources')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Import/sync data source (validate and fetch metadata)
app.post('/api/data-sources/:id/import', async (req, res) => {
    try {
        const { id } = req.params;

        // Get the data source
        const { data: source, error: fetchError } = await supabase
            .from('data_sources')
            .select('*')
            .eq('id', id)
            .single();
        if (fetchError) throw fetchError;

        // Fetch CSV from Google Sheets
        const response = await fetch(source.sheet_url);
        if (!response.ok) throw new Error('Failed to fetch Google Sheet. Check if the URL is a valid publish-to-web CSV link.');
        const csvContent = await response.text();
        const rows = parseCSV(csvContent);

        // Find date range from data
        let minDate = null, maxDate = null;
        rows.forEach(row => {
            const orderDate = parseDate(row['Order Date']);
            if (orderDate) {
                if (!minDate || orderDate < minDate) minDate = orderDate;
                if (!maxDate || orderDate > maxDate) maxDate = orderDate;
            }
        });

        // Update data source with metadata
        const updateData = {
            status: 'active',
            record_count: rows.length,
            last_imported_at: new Date().toISOString(),
            date_range_start: minDate ? minDate.toISOString().split('T')[0] : null,
            date_range_end: maxDate ? maxDate.toISOString().split('T')[0] : null,
            updated_at: new Date().toISOString()
        };

        const { data: updated, error: updateError } = await supabase
            .from('data_sources')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (updateError) throw updateError;

        res.json({ success: true, source: updated, recordCount: rows.length });
    } catch (error) {
        // Mark as error status
        await supabase.from('data_sources').update({ status: 'error', updated_at: new Date().toISOString() }).eq('id', req.params.id);
        res.status(500).json({ error: error.message });
    }
});

// ===== SALES ANALYSIS API =====
// Helper function to parse CSV
function parseCSV(content) {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^\"|\"$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        // Handle quoted CSV fields properly
        const row = {};
        let currentField = '';
        let inQuotes = false;
        let fieldIndex = 0;

        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row[headers[fieldIndex]] = currentField.trim().replace(/^`/, '');
                fieldIndex++;
                currentField = '';
            } else {
                currentField += char;
            }
        }
        row[headers[fieldIndex]] = currentField.trim().replace(/^`/, '');
        rows.push(row);
    }
    return rows;
}

// Helper to parse dates from various formats
function parseDate(dateStr) {
    if (!dateStr) return null;
    // Handle format: 9/29/25 11:37 or 10/1/25 00:00
    const parts = dateStr.split(' ')[0].split('/');
    if (parts.length === 3) {
        let [month, day, year] = parts;
        year = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
        return new Date(year, parseInt(month) - 1, parseInt(day));
    }
    return new Date(dateStr);
}

app.get('/api/sales-analysis', async (req, res) => {
    try {
        const { startDate, endDate, marketplace, status, paymentMode } = req.query;

        // Fetch all active data sources from database
        const { data: sources, error: sourcesError } = await supabase
            .from('data_sources')
            .select('*')
            .eq('status', 'active');

        if (sourcesError) throw sourcesError;

        if (!sources || sources.length === 0) {
            return res.json({
                kpis: { ordersReceived: 0, ordersShipped: 0, pendingOrders: 0, returnedOrders: 0, cancelledOrders: 0, onTimeDispatch: 0, orderAccuracy: 0, totalRevenue: 0, avgOrderValue: 0 },
                charts: { salesTrend: [], marketplaceRevenue: [], statusDistribution: [], topProducts: [], topStates: [], categoryBreakdown: [] },
                filters: { marketplaces: [], statuses: [], paymentModes: [] },
                message: 'No active data sources. Add and import data sources first.'
            });
        }

        // Fetch and combine data from all active sources
        let orders = [];
        for (const source of sources) {
            try {
                const response = await fetch(source.sheet_url);
                if (response.ok) {
                    const csvContent = await response.text();
                    const sourceOrders = parseCSV(csvContent);
                    orders = orders.concat(sourceOrders);
                }
            } catch (e) { console.error(`Failed to fetch source ${source.name}:`, e); }
        }

        if (orders.length === 0) {
            throw new Error('No data available. Please import your data sources.');
        }

        // Apply filters
        if (startDate) {
            const start = new Date(startDate);
            orders = orders.filter(o => {
                const orderDate = parseDate(o['Order Date']);
                return orderDate && orderDate >= start;
            });
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            orders = orders.filter(o => {
                const orderDate = parseDate(o['Order Date']);
                return orderDate && orderDate <= end;
            });
        }

        if (marketplace && marketplace !== 'All') {
            orders = orders.filter(o => o['MP Name'] === marketplace);
        }

        if (status && status !== 'All') {
            orders = orders.filter(o => o['Order Status'] === status);
        }

        if (paymentMode && paymentMode !== 'All') {
            orders = orders.filter(o => o['Payment Mode'] === paymentMode);
        }

        // Calculate KPIs
        const totalOrders = orders.length;
        const shippedOrders = orders.filter(o => o['Shipping Status'] === 'Delivered' || o['Order Status'] === 'Shipped').length;
        const pendingOrders = orders.filter(o => o['Order Status'] !== 'Shipped' && o['Order Status'] !== 'Cancelled' && o['Shipping Status'] !== 'Delivered').length;
        const returnedOrders = orders.filter(o => o['Order Status'] === 'Returned').length;
        const cancelledOrders = orders.filter(o => o['Order Status'] === 'Cancelled').length;

        // Calculate revenue
        const totalRevenue = orders.reduce((sum, o) => {
            const price = parseFloat(o['Selling Price']) || 0;
            return sum + price;
        }, 0);

        // Revenue by marketplace
        const marketplaceRevenue = {};
        const marketplaceOrders = {};
        orders.forEach(o => {
            const mp = o['MP Name'] || 'Unknown';
            if (!marketplaceRevenue[mp]) {
                marketplaceRevenue[mp] = 0;
                marketplaceOrders[mp] = 0;
            }
            marketplaceRevenue[mp] += parseFloat(o['Selling Price']) || 0;
            marketplaceOrders[mp]++;
        });

        // Revenue by date (for trend chart)
        const dailyRevenue = {};
        const dailyOrders = {};
        orders.forEach(o => {
            const orderDate = parseDate(o['Order Date']);
            if (orderDate) {
                const dateStr = orderDate.toISOString().split('T')[0];
                if (!dailyRevenue[dateStr]) {
                    dailyRevenue[dateStr] = 0;
                    dailyOrders[dateStr] = 0;
                }
                dailyRevenue[dateStr] += parseFloat(o['Selling Price']) || 0;
                dailyOrders[dateStr]++;
            }
        });

        // Sort daily data by date
        const sortedDates = Object.keys(dailyRevenue).sort();
        const salesTrend = sortedDates.map(date => ({
            date,
            revenue: Math.round(dailyRevenue[date] * 100) / 100,
            orders: dailyOrders[date]
        }));

        // Top products by quantity
        const productQty = {};
        const productRevenue = {};
        orders.forEach(o => {
            const product = o['Product Name'] || 'Unknown';
            const qty = parseInt(o['Item Quantity']) || 1;
            const price = parseFloat(o['Selling Price']) || 0;
            if (!productQty[product]) {
                productQty[product] = 0;
                productRevenue[product] = 0;
            }
            productQty[product] += qty;
            productRevenue[product] += price;
        });

        const topProducts = Object.entries(productQty)
            .map(([name, qty]) => ({ name, quantity: qty, revenue: Math.round(productRevenue[name] * 100) / 100 }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        // Order status distribution
        const statusDistribution = {};
        orders.forEach(o => {
            const orderStatus = o['Order Status'] || 'Unknown';
            statusDistribution[orderStatus] = (statusDistribution[orderStatus] || 0) + 1;
        });

        // Payment mode distribution
        const paymentDistribution = {};
        orders.forEach(o => {
            const mode = o['Payment Mode'] || 'Unknown';
            paymentDistribution[mode] = (paymentDistribution[mode] || 0) + 1;
        });

        // Calculate metrics percentages
        const onTimeDispatch = totalOrders > 0 ? Math.round((shippedOrders / totalOrders) * 100 * 10) / 10 : 0;
        const orderAccuracy = totalOrders > 0 ? Math.round(((totalOrders - returnedOrders - cancelledOrders) / totalOrders) * 100 * 10) / 10 : 0;

        // Get unique values for filters
        const allMarketplaces = [...new Set(orders.map(o => o['MP Name']).filter(Boolean))];
        const allStatuses = [...new Set(orders.map(o => o['Order Status']).filter(Boolean))];
        const allPaymentModes = [...new Set(orders.map(o => o['Payment Mode']).filter(Boolean))];

        // Category breakdown
        const categoryBreakdown = {};
        orders.forEach(o => {
            const cat = o['Category'] || 'Unknown';
            if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { orders: 0, revenue: 0 };
            categoryBreakdown[cat].orders++;
            categoryBreakdown[cat].revenue += parseFloat(o['Selling Price']) || 0;
        });

        // State-wise distribution
        const stateDistribution = {};
        orders.forEach(o => {
            const state = o['Shipping State'] || 'Unknown';
            if (!stateDistribution[state]) stateDistribution[state] = { orders: 0, revenue: 0 };
            stateDistribution[state].orders++;
            stateDistribution[state].revenue += parseFloat(o['Selling Price']) || 0;
        });

        const topStates = Object.entries(stateDistribution)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 10);

        res.json({
            // KPIs
            kpis: {
                ordersReceived: totalOrders,
                ordersShipped: shippedOrders,
                pendingOrders,
                returnedOrders,
                cancelledOrders,
                onTimeDispatch,
                orderAccuracy,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                avgOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0
            },
            // Chart data
            charts: {
                salesTrend,
                marketplaceRevenue: Object.entries(marketplaceRevenue).map(([name, revenue]) => ({
                    name,
                    revenue: Math.round(revenue * 100) / 100,
                    orders: marketplaceOrders[name]
                })),
                statusDistribution: Object.entries(statusDistribution).map(([name, count]) => ({ name, count })),
                paymentDistribution: Object.entries(paymentDistribution).map(([name, count]) => ({ name, count })),
                topProducts,
                topStates,
                categoryBreakdown: Object.entries(categoryBreakdown).map(([name, data]) => ({
                    name,
                    orders: data.orders,
                    revenue: Math.round(data.revenue * 100) / 100
                }))
            },
            // Filter options
            filters: {
                marketplaces: allMarketplaces,
                statuses: allStatuses,
                paymentModes: allPaymentModes
            }
        });
    } catch (error) {
        console.error('Sales analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Catch-all route
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
