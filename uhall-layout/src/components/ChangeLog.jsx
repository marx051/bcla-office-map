import React from 'react';

const ChangeLog = ({ changes }) => {
  if (!changes || changes.length === 0) {
    return <div>No changes made yet.</div>;
  }

  return (
    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', marginTop: '10px' }}>
      <h3>Change Log</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Timestamp</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>From Room</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>To Room</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((change, index) => (
            <tr key={index}>
              <td style={{ borderBottom: '1px solid #eee' }}>{new Date(change.timestamp).toLocaleString()}</td>
              <td style={{ borderBottom: '1px solid #eee' }}>{change.from}</td>
              <td style={{ borderBottom: '1px solid #eee' }}>{change.to}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChangeLog;
