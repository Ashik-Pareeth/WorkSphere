import React, { useEffect, useState } from 'react';

function DepartmentForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  function saveDepartment(e) {
    e.preventDefault();
    const department = {
      departmentName: name,
      departmentDescription: description,
    };
    fetch('http://localhost:8080/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(department),
    }).then(() => {
      console.log('Department saved');
      setDescription('');
      setName('');
    });
  }
  const [rows, setRows] = useState([]);
  useEffect(() => {
    fetch('http://localhost:8080/departments', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => setRows(data));
  }, []);
  return (
    <div>
      <form onSubmit={saveDepartment}>
        <h3>Add Department</h3>
        <label>Department name:</label>
        <div>
          <input
            type="text"
            value={name}
            name="name"
            id="name"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>Department Description:</div>
        <div>
          <textarea
            value={description}
            name="description"
            id="description"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit">Save Department</button>
      </form>
      <hr />
      <table width={200}>
        <tr>
          <th>slno</th>
          <th>name</th>
          <th>Description</th>
        </tr>

        {rows.map((row) => (
          <tr key={row.departmentId}>
            <td>{row.departmentId}</td>
            <td>{row.departmentName}</td>
            <td>{row.departmentDescription}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}
export default DepartmentForm;
