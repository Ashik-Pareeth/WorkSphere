const fs = require('fs');

function replace(file, find, replaceWith) {
  const c = fs.readFileSync('src/' + file, 'utf8');
  fs.writeFileSync('src/' + file, c.replace(find, replaceWith));
}

replace('features/bulletin/AnonymousToggle.jsx', 'catch (err) { /* eslint-disable-line no-unused-vars */ {', 'catch (err) { /* eslint-disable-line no-unused-vars */');
replace('features/auth/ForgotPassword.jsx', 'import { useNavigate, Link } from \'react-router-dom\';', 'import { Link } from \'react-router-dom\';');
replace('features/hiring/PublicApplyForm.jsx', '(_, i) /* eslint-disable-line no-unused-vars */', '(_dummy, i) /* eslint-disable-line no-unused-vars */');
replace('features/tasks/TaskDetailsModal.jsx', '/* eslint-disable-next-line no-unused-vars */\n/* eslint-disable-next-line no-unused-vars */\nconst { user: currentUser }', '/* eslint-disable-next-line no-unused-vars */\nconst { user: currentUser }');
replace('features/tasks/TaskDetailsModal.jsx', '/* eslint-disable-next-line no-unused-vars */\nconst { user: currentUser }', '// eslint-disable-next-line no-unused-vars\n  const { user: currentUser }');
replace('features/tasks/tabs/EvidenceTab.jsx', '/* eslint-disable-next-line no-unused-vars */\n  const handleLateRating', '// eslint-disable-next-line no-unused-vars\n  const handleLateRating');
console.log('Fixed syntax anomalies!');
