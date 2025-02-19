To start mysql, in the terminal, type in `mysql -u root`

# Create a new database user
In the MySQL CLI:
```
CREATE USER 'ahkow'@'localhost' IDENTIFIED BY 'rotiprata123';ß
```

```
GRANT ALL PRIVILEGES on sakila.* TO 'ahkow'@'localhost' WITH GRANT OPTION;
```
**Note:** Replace *sakila* with the name of the database you want the user to have access to
 
 ```
FLUSH PRIVILEGES;



create table locations(
    location_id int unsigned auto_increment primary key,
    name varchar(255),
    address varchar(255)
) engine = innodb;

create table sessions(
    session_id int unsigned auto_increment primary key
    date_time datetime
) engine = innodb;

create table attendance(
    attendance_id int unsigned auto_increment primary key
) engine = innodb;

alter table parents add column contact_number varchar(30) not null;

alter table parents modify column contact_number varchar(50) null default 'n/a';

alter table parents drop column contact_number;

alter table students modify column swimming_level tinyint unsigned ;


insert into parents (first_name, last_name) values ("Ah Kow", "Tan");

update parents set contact_number="123456789" WHERE parent_id=1;

insert into students (name, swimming_level, dob, parent_id) values ('Desmond Tan', '1', '2010-09-10', 1);

select * from Employees join
Departments on Employees.department_id = Departments.department_id;

UPDATE Customers SET first_name = "James", last_name = "Smith", rating = "4", company_id = "2"
WHERE customer_id = "6";



const firstName = req.query.FirstName
const lastName = req.query.LastName

let sql = 
select * from customers
join companies
on customers.company_id - companies.company_id

const bindings = []

if (firstName) {
    sql +- ` where first name like ?;
    bindings.push('%' + firstName + %)
}

const []

add date to the customers table