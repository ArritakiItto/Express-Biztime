const express = require('express');
const slugify = require('slugify');
const router = new express.Router();
const ExpressError = require("../expressError")
const db = require('../db')

//get list companies:
router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(
          `SELECT code, name 
           FROM companies 
           ORDER BY name`
    );

    return res.json({"companies": result.rows});
  }

  catch (err) {
    return next(err);
  }
});

//GET/companies/[code]
router.get('/:code', async function (req, res, next) {
  try {
    const code= req.params.code;

    const compResult = await db.query('SELECT code, name, description FROM companies WHERE code =$1');
    const invResult = await db.query('SELECT id FROM invoices WHERE comp_code = $1');

    if (compResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = compResult.rows[0];
    const invoices = invResult.rows;
    company.invoices = invoices.map(inv => inv.id);

    return res.json({'company': company });
  } catch (err) {
    return next (err);
  }
});

//POST/companies
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const code = slugify(name, { lower: true });

    const result = await db.query(
      'INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description',
      [code, name, description]
    );

    return res.status(201).json({ company: result.rows[0] });

  } catch (err) {
    return next(err);
  }
});

//PUT/companies/[code]
//update exisitng companies
router.put('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const result = await db.query(
      'UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description',
      [name, description, code]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    return res.json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

//Delete/companies/[code]
router.delete('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const result = await db.query('DELETE FROM companies WHERE code = $1 RETURNING code', [code]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    return res.json({ status: 'deleted' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

//http://localhost:3000/companies