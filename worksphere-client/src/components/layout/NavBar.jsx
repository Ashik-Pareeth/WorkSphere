import { Link } from 'react-router-dom';
import './NavBar.css';

export default function NavBar() {
  return (
    <nav className="navbar">
      <Link to={'/'}>Home</Link>
      <Link to={'/departments'}>Add Department</Link>
      <Link to={'/jobPosition'}>Add Job Position</Link>
      <Link to={'/register'}>Add new Employee</Link>
    </nav>
  );
}
