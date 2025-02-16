const express = require("express");
const hbs = require("hbs");
const wax = require("wax-on");
require("dotenv").config();
const { createConnection } = require("mysql2/promise");

const app = express();
app.set("view engine", "hbs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

wax.on(hbs.handlebars);
wax.setLayoutPath("./views/layouts");

// require in handlebars and their helpers
const helpers = require("handlebars-helpers");
// tell handlebars-helpers where to find handlebars
helpers({
  handlebars: hbs.handlebars,
});

let connection;

async function main() {
  // Connect to MySQL
  connection = await createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
  });

  app.get("/", (req, res) => {
    try {
      res.render("home");
    } catch (err) {
      res.render("error", { errorMessage: "Error rendering home page" });
    }
  });

  // Test route for MySQL connection 
  app.get("/test-mysql", async (req, res) => {
    try {
      const [results] = await connection.execute("SELECT NOW() AS now");
      res.send(`Current MySQL time: ${results[0].now}`);
    } catch (err) {
      res.status(500).send("Error executing query");
    }
  });

  //Customers Routes
  app.get("/customers", async (req, res) => {
    try {
      const [customers] = await connection.execute(
        `SELECT * FROM Customers
         JOIN Companies
           ON Customers.company_id = Companies.company_id;`
      );
  
      res.render("customers/index", {
        customers: customers,
      });
    } catch (err) {
      res.render("error", { errorMessage: "Unable to retrieve customers" });
    }
  });

  app.get("/customers/create", async function (req, res) {
    try {
      const [companies] = await connection.execute("SELECT * FROM Companies");
      res.render("customers/add", {
        companies: companies,
      });
    } catch (err) {
      res.render("error", { errorMessage: "Unable to load customer creation form" });
    }
  });

  app.post("/customers/create", async function (req, res) {
    try {
      const bindings = [
        req.body.first_name,
        req.body.last_name,
        req.body.rating,
        req.body.company_id,
      ];
  
      await connection.execute(
        `INSERT INTO Customers (first_name, last_name, rating, company_id)
         VALUES (?, ?, ?, ?);`,
        bindings
      );
  
      res.redirect("/customers");
    } catch (err) {
      res.render("error", { errorMessage: "Unable to create customer" });
    }
  });

  app.get("/customers/:customer_id/edit", async function (req, res) {
    try {
      const bindings = [req.params.customer_id];
  
      const [customer] = await connection.execute(
        "SELECT * FROM Customers WHERE customer_id = ?",
        bindings
      );
      const customerToUpdate = customer[0];
  
      const [companies] = await connection.execute("SELECT * FROM Companies");
  
      res.render("customers/edit", {
        customer: customerToUpdate,
        companies,
      });
    } catch (err) {
      res.render("error", { errorMessage: "Unable to load edit form" });
    }
  });

  app.post("/customers/:customer_id/edit", async function (req, res) {
    try {
      const query = `
      UPDATE Customers
      SET first_name = ?, last_name = ?, rating = ?, company_id = ?
      WHERE customer_id = ?;
      `;
      const bindings = [
        req.body.first_name,
        req.body.last_name,
        req.body.rating,
        req.body.company_id,
        req.params.customer_id,
      ];
      await connection.execute(query, bindings);
      res.redirect("/customers");
    } catch (e) {
      console.log(e);
      res.render("error", {
        errorMessage: "Unable to process update. Contact admin or try again",
      });
    }
  });

  app.get("/customers/:employee_id/delete", async function (req, res) {
    try {
      const customerId = req.params.customer_id;
      const results = await connection.execute(
        `SELECT * FROM Employees WHERE employee_id = ?`,
        [customerId]
      );
      const customers = results[0];
      const customerToDelete = customers[0];
      res.render("customers/delete", {
        customer: customerToDelete,
      });
    } catch (e) {
      res.send("Unable to process delete");
    }
  });

  app.post("/customers/:customer_id/delete", async function (req, res) {
    try {
      const customerId = req.params.customer_id;
      const query = `DELETE FROM Customers WHERE customer_id = ?`;
      await connection.execute(query, [customerId]);
      res.redirect("/customers");
    } catch (e) {
      console.log(e);
      res.render("error", {
        errorMessage: "Unable to process delete. Contact admin or try again",
      });
    }
  });

  // Employees routes
  app.get("/employees", async function (req, res) {
    try {
      const results = await connection.execute(
        `SELECT * FROM Employees 
         JOIN Departments
           ON Employees.department_id = Departments.department_id;`
      );
      const employees = results[0];
      console.log(employees);
      res.render("employees", { employees: employees });
    } catch (err) {
      res.render("error", { errorMessage: "Unable to retrieve employees" });
    }
  });

  app.get("/employees/create", async function (req, res) {
    try {
      const results = await connection.execute("SELECT * FROM Departments");
      const departments = results[0];
      res.render("employees/add", { departments: departments });
    } catch (err) {
      res.render("error", { errorMessage: "Unable to load employee creation form" });
    }
  });

  app.post("/employees/create", async function (req, res) {
    try {
      const firstName = req.body.first_name;
      const lastName = req.body.last_name;
      const departmentId = req.body.department_id;
  
      const sql = `INSERT INTO Employees (first_name, last_name, department_id)
                   VALUES (?, ?, ?);`;
      const bindings = [firstName, lastName, departmentId];
  
      await connection.execute(sql, bindings);
      res.redirect("/employees");
    } catch (err) {
      res.render("error", { errorMessage: "Unable to create employee" });
    }
  });

  app.get("/employees/:employee_id/delete", async function (req, res) {
    try {
      const employeeId = req.params.employee_id;
      const results = await connection.execute(
        `SELECT * FROM Employees WHERE employee_id = ?`,
        [employeeId]
      );
      const employees = results[0];
      const employeeToDelete = employees[0];
      res.render("employees/delete", { employee: employeeToDelete });
    } catch (e) {
      res.send("Unable to process delete");
    }
  });

  app.post("/employees/:employee_id/delete", async function (req, res) {
    try {
      const employeeId = req.params.employee_id;
      const query = `DELETE FROM Employees WHERE employee_id = ?`;
      await connection.execute(query, [employeeId]);
      res.redirect("/employees");
    } catch (e) {
      console.log(e);
      res.render("error", {
        errorMessage: "Unable to process delete. Contact admin or try again",
      });
    }
  });

  app.get("/employees/:employee_id/edit", async function (req, res) {
    try {
      const bindings = [req.params.employee_id];
  
      const [employees] = await connection.execute(
        "SELECT * FROM Employees WHERE employee_id = ?",
        bindings
      );
      const employeeToUpdate = employees[0];
  
      const [departments] = await connection.execute("SELECT * FROM Departments");
  
      res.render("employees/edit", {
        employee: employeeToUpdate,
        departments: departments,
      });
    } catch (err) {
      res.render("error", { errorMessage: "Unable to load employee edit form" });
    }
  });

  app.post("/employees/:employee_id/edit", async function (req, res) {
    try {
      const query = `
      UPDATE Employees SET first_name = ?, last_name = ?, department_id = ?
      WHERE employee_id = ?;
      `;
      const bindings = [
        req.body.first_name,
        req.body.last_name,
        req.body.department_id,
        req.params.employee_id,
      ];
  
      await connection.execute(query, bindings);
      res.redirect("/employees");
    } catch (err) {
      res.render("error", { errorMessage: "Unable to update employee" });
    }
  });

  // Departments routes 
  app.get("/departments", async function (req, res) {
    try {
      const results = await connection.execute("SELECT * FROM Departments");
      const departments = results[0];
      res.render("departments", { departments: departments });
    } catch (err) {
      res.render("error", { errorMessage: "Unable to retrieve departments" });
    }
  });

  app.get("/departments/create", async function (req, res) {
    try {
      const results = await connection.execute("SELECT * FROM Departments");
      const departments = results[0];
      res.render("departments/add", { departments: departments });
    } catch (err) {
      res.render("error", { errorMessage: "Unable to load department creation form" });
    }
  });

  app.post("/departments/create", async function (req, res) {
    try {
      const departmentName = req.body.name;
      const sql = `
        INSERT INTO Departments (name)
        VALUES (?);
      `;
      const bindings = [departmentName];
  
      await connection.execute(sql, bindings);
      res.redirect("/departments");
    } catch (err) {
      res.render("error", { errorMessage: "Unable to create department" });
    }
  });

  app.get("/departments/:department_id/delete", async function (req, res) {
    try {
      const departmentId = req.params.department_id;
      const results = await connection.execute(
        `SELECT * FROM Departments WHERE department_id = ?`,
        [departmentId]
      );
      const departments = results[0];
      const departmentToDelete = departments[0];
      res.render("departments/delete", { department: departmentToDelete });
    } catch (e) {
      res.send("Unable to process delete");
    }
  });

  app.post("/departments/:department_id/delete", async function (req, res) {
    try {
      const departmentId = req.params.department_id;
      const query = `DELETE FROM Departments WHERE department_id = ?`;
      await connection.execute(query, [departmentId]);
      res.redirect("/departments");
    } catch (e) {
      console.log(e);
      res.render("error", {
        errorMessage: "Unable to process delete. Contact admin or try again",
      });
    }
  });
}

main();

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

main().catch((err) => {
  console.error("Error connecting to MySQL:", err);
});
