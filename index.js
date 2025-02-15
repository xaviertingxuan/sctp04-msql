const express = require('express');
const hbs = require('hbs');
const wax = require('wax-on');
require('dotenv').config();
const { createConnection } = require('mysql2/promise');

const app = express();
app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts');

// require in handlebars and their helpers
const helpers = require('handlebars-helpers');
// tell handlebars-helpers where to find handlebars
helpers({
    'handlebars': hbs.handlebars
})

let connection;

async function main() {
  // Connect to MySQL
  connection = await createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD
  });

  // Test the connection
  console.log("Connected to MySQL");

  app.get('/', (req, res) => {
    res.send('Hello, World!');
  });
  
  // Test route for MySQL connection
  app.get('/test-mysql', async (req, res) => {
    try {
      const [results] = await connection.execute('SELECT NOW() AS now');
      res.send(`Current MySQL time: ${results[0].now}`);
    } catch (err) {
      res.status(500).send('Error executing query');
    }
  });

  app.get('/customers', async (req, res) => {
    const [customers] = await connection.execute({
      sql: `
        SELECT * FROM Customers 
        INNER JOIN Companies ON Customers.company_id = Companies.company_id
      `,
      nestTables: true
    });
    res.render('customers/index', {
      'customers': customers
    });
  });

  app.get('/customers/create', async(req,res)=>{
    const [companies] = await connection.execute('SELECT * from Companies');
    const [employees] = await connection.execute('SELECT * from Employees');
    res.render('customers/add', {
        'companies': companies,
        'employees': employees
    })

//add post route for create
app.post('/customers/create', async(req,res)=>{
  let {first_name, last_name, rating, company_id, employee_id} = req.body;
  let query = 'INSERT INTO Customers (first_name, last_name, rating, company_id) VALUES (?, ?, ?, ?)';
  let bindings = [first_name, last_name, rating, company_id];
  let [result] = await connection.execute(query, bindings);

  let newCustomerId = result.insertId;
  for (let id of employee_id) {
      let query = 'INSERT INTO EmployeesCustomers (employee_id, customer_id) VALUES (?, ?)';
      let bindings = [id, newCustomerId];
      await connection.execute(query, bindings);
  }

//   app.post('/customers/add', async function(req,res) {
//     // to extract data from a form, we will
//     // use the name of the field as a key in req.body
//     const firstName = req.body.first_name;
//     const lastName = req.body.last_name;
//     const rating = req.body.rating;
//     const companyId = req.body.company_id;

//     const bindings = [firstName, lastName, rating, companyId]

//     // use a prepared statement to insert rows -- a secured way to prevent MySQL injection attacks
//     await connection.execute(`INSERT INTO Customers (first_name, last_name, rating, company_id)
// VALUES (?, ?, ?, ? );`, bindings);

// // tell the browser to go a different URL
//     res.redirect("/customers");
// })


  res.send('form submitted');
})

//add get route for update
app.get('/customers/:customer_id/edit', async (req, res) => {
    let [employees] = await connection.execute('SELECT * from Employees');
    let [customers] = await connection.execute('SELECT * from Customers WHERE customer_id = ?', [req.params.customer_id]);
    let [employeeCustomers] = await connection.execute('SELECT * from EmployeeCustomer WHERE customer_id = ?', [req.params.customer_id]);

    let customer = customers[0];
    let relatedEmployees = employeeCustomers.map(ec => ec.employee_id);

    res.render('customers/edit', {
        'customer': customer,
        'employees': employees,
        'relatedEmployees': relatedEmployees
    })
});
//add post route for update
app.post('/customers/:customer_id/edit', async (req, res) => {
    const {first_name, last_name, rating, company_id, employee_id} = req.body;

    const query = 'UPDATE Customers SET first_name=?, last_name=?, rating=?, company_id=? WHERE customer_id=?';
    const bindings = [first_name, last_name, rating, company_id, req.params.customer_id];
    await connection.execute(query, bindings);

    // await connection.execute('DELETE FROM EmployeeCustomer WHERE customer_id = ?', [req.params.customer_id]);

    // for (let id of employee_id) {
    //     let query = 'INSERT INTO EmployeeCustomer (employee_id, customer_id) VALUES (?, ?)';
    //     let bindings = [id, req.params.customer_id];
    //     await connection.execute(query, bindings);
    // }

    res.redirect('/customers');
});



//add get route for delete
app.get('/customers/:customer_id/delete', async function(req,res){
    // display a confirmation form 
    const [customers] = await connection.execute(
        "SELECT * FROM Customers WHERE customer_id =?", [req.params.customer_id]
    );
    const customer = customers[0];

    res.render('customers/delete', {
        customer
    })

})
//add post route for delete
app.post('/customers/:customer_id/delete', async function(req, res){
    await connection.execute(`DELETE FROM Customers WHERE customer_id = ?`, [req.params.customer_id]);
    res.redirect('/customers');
})




//add get route for employees
app.get('/employees', async (req, res) => {
    const [employees] = await connection.execute({
      sql: `
        SELECT * FROM Employees 
        INNER JOIN Departments ON Employees.department_id = Departments.department_id
      `,
      nestTables: true
    });

    res.render('employees/index', {
        employees
    });
  });


  app.get('/employees/delete', async(req,res)=>{
    const [employees] = await connection.execute('SELECT * from Employees');
    res.render('employees/delete', {
        'employees': employees
    })
  })
})

}
main();


  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });


main().catch(err => {
  console.error('Error connecting to MySQL:', err);
});