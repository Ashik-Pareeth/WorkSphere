// A reusable Alert component for success, error, and warning messages
const AlertMessage = ({ error, success, type = 'error', onClose }) => {
  // If no message is passed, don't render anything
  if (!error && !success) return null;

  // 1. Determine the message type (Success overrides error if both exist)
  const actualType = success ? 'success' : type;

  // 2. Extract the message text smartly
  let messageContent = null;

  if (success) {
    messageContent = success;
  } else if (typeof error === 'string') {
    // Simple string error
    messageContent = error;
  } else if (error?.response?.data) {
    // Spring Boot Backend Error
    const data = error.response.data;

    // Case A: Validation Errors (e.g. "Email cannot be empty")
    if (data.validationErrors) {
      messageContent = (
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          {Object.entries(data.validationErrors).map(([field, msg]) => (
            <li key={field}>{msg}</li>
          ))}
        </ul>
      );
    }
    // Case B: Standard API Error (e.g. "User not found")
    else {
      messageContent = data.message || 'An unexpected error occurred.';
    }
  } else {
    // Fallback for network errors (server down)
    messageContent =
      error.message || 'Network Error. Please check your connection.';
  }

  // 3. Styles
  const styles = {
    container: {
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
      fontSize: '0.95rem',
      lineHeight: '1.5',
      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
      animation: 'fadeIn 0.3s ease-in-out',
    },
    // Colors
    error: {
      backgroundColor: '#FEF2F2',
      color: '#991B1B',
      border: '1px solid #FCA5A5',
    },
    success: {
      backgroundColor: '#F0FDF4',
      color: '#166534',
      border: '1px solid #86EFAC',
    },
    warning: {
      backgroundColor: '#FEFCE8',
      color: '#854D0E',
      border: '1px solid #FDE047',
    },

    closeBtn: {
      background: 'none',
      border: 'none',
      color: 'inherit',
      fontSize: '1.25rem',
      cursor: 'pointer',
      padding: '0 0 0 1rem',
      lineHeight: '1',
      opacity: 0.7,
    },
  };

  return (
    <div style={{ ...styles.container, ...styles[actualType] }}>
      <div style={{ flex: 1 }}>
        <strong>{actualType === 'error' ? 'Error' : 'Success'}: </strong>
        {messageContent}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          style={styles.closeBtn}
          onMouseOver={(e) => (e.currentTarget.style.opacity = 1)}
          onMouseOut={(e) => (e.currentTarget.style.opacity = 0.7)}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default AlertMessage;
