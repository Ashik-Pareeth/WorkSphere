import React, { useEffect, useState } from 'react';
function Role() {
  const [name, setName] = useState('');
  function saveRole(e) {
    e.preventDefault();
    const roles = {
      roleName: name,
    };
    fetch('http://localhost:8080/roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roles),
    })
      .then(() => {
        console.log('successfull');
        setName('');
      })
      .then(() => {
        return fetch('http://localhost:8080/roles');
      })
      .then((res) => res.json())
      .then((data) => getRows(data));
  }
  const [rows, getRows] = useState([]);
  useEffect(() => {
    fetch('http://localhost:8080/roles', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => getRows(data));
  }, []);
  return (
    <div>
      <form onSubmit={saveRole}>
        <div>
          Role name:
          <div>
            <input
              type="text"
              value={name}
              name="roleName"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <button type="submit">Add Role</button>
      </form>
      <table width="200">
        <thead>
          <tr>
            <th>sl no</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.roleId}>
              <td>{row.roleId}</td>
              <td>{row.roleName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Role;
