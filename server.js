// Godown Dashboard - Express Server with Supabase
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

// Catch-all route
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
