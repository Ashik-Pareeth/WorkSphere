import React, { useEffect, useState } from 'react';
function AddEmployee() {
  const [userName, setUserName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  //const [contact, setContact] = useState('');
  const [roleId, setRoleId] = useState('');
  const [departmentId, setDepertmentId] = useState('');
  const [salary, setSalary] = useState('');
  const [password, setPassword] = useState('');
  function saveEmployee(e) {
    e.preventDefault();
    const employee = {
      userName: userName,
      firstName: firstName,
      lastName: lastName,
      email: email,
      //contact: contact,
      role: { roleId: roleId },
      department: { departmentId: departmentId },
      salary: salary,
      password: password,
    };

    fetch('http://localhost:8080/employees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employee),
    }).then(() => {
      console.log('Successful');
      setFirstName('');
      //setContact('');
      setEmail('');
      setLastName('');
      setRoleId('');
      setDepertmentId('');
    });
  }
  const [roleRows, getRolesRows] = useState([]);
  const [depRows, getDepRows] = useState([]);
  const [employeeRows, getEmployeeRows] = useState([]);
  useEffect(() => {
    fetch('http://localhost:8080/roles', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => getRolesRows(data));

    fetch('http://localhost:8080/departments', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => getDepRows(data));

    fetch('http://localhost:8080/employees', {
      method: 'get',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => getEmployeeRows(data));
  }, []);
  return (
    <div>
      <form onSubmit={saveEmployee}>
        <div>
          Enter First Name:
          <input
            type="text"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          Enter Last Name:
          <input
            type="text"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div>
          Enter UserName:
          <input
            type="text"
            name="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <div>
          Enter Email:
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          Role:
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            {' '}
            <option value="">--Select--</option>
            {roleRows.map((row) => (
              <option key={row.roleId} value={row.roleId}>
                {row.roleName}
              </option>
            ))}
          </select>
        </div>
        <div>
          Department:
          <select
            value={departmentId}
            onChange={(e) => setDepertmentId(e.target.value)}
          >
            {' '}
            <option value="">--Select--</option>
            {depRows.map((row) => (
              <option key={row.departmentId} value={row.departmentId}>
                {row.departmentName}
              </option>
            ))}
          </select>
        </div>
        <div>
          Salary:
          <input
            type="text"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
        </div>
        <div>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Add Employee</button>
      </form>
      <table width="200">
        <thead>
          <tr>
            <th>Slno</th>
            <th>User Name</th>
            <th>Name</th>
            <th>email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Salary</th>
            <th>Joining Date</th>
          </tr>
        </thead>
        <tbody>
          {employeeRows.map((empRows) => (
            <tr key={empRows.employeeId}>
              <td>{empRows.employeeId}</td>
              <td>{empRows.userName}</td>
              <td>
                {empRows.firstName} {empRows.lastName}
              </td>
              <td>{empRows.email} </td>
              <td>{empRows.role.roleName}</td>
              <td> {empRows.department.departmentName}</td>
              <td>{empRows.salary} </td>
              <td>{empRows.joiningDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default AddEmployee;
