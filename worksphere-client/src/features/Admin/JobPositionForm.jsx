import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

function JobPositionForm() {
  const [title, setTitle] = useState('');
  const [rows, setRows] = useState([]);

  const fetchPositions = async () => {
    try {
      const response = await axiosInstance.get('/jobPositions');
      setRows(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const savePosition = async (e) => {
    e.preventDefault();
    const position = { positionName: title };

    try {
      await axiosInstance.post('/jobPositions', position);
      setTitle('');
      fetchPositions();
    } catch (err) {
      console.log(err);
    }
  };

  const inputStyle =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Job Position Management
      </h2>

      {/* FORM CARD */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <form onSubmit={savePosition} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1">
                Job Title
              </label>

              <input
                type="text"
                className={inputStyle}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Add Position
          </button>
        </form>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white shadow-sm rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Position List</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Job Title</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">{row.positionName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default JobPositionForm;
