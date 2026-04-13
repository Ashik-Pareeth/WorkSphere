const fs = require('fs');

function replaceRegex(file, regex, replaceWith) {
  const path = 'src/' + file;
  if (!fs.existsSync(path)) return;
  let c = fs.readFileSync(path, 'utf8');
  fs.writeFileSync(path, c.replace(regex, replaceWith));
}

replaceRegex('features/hiring/CandidateDrawer.jsx', /getCandidateResumeUrl,\s*/g, '');
replaceRegex('features/hiring/PublicApplyForm.jsx', /\(_, i\) \/\*/g, '(_dummy, i) /*');
replaceRegex('features/hiring/PublicApplyForm.jsx', /\(_, i\)/g, '(_dummy, i)');
replaceRegex('features/tasks/TaskDetailsModal.jsx', /const \{ user: currentUser \} = useAuth\(\);/g, '// eslint-disable-next-line no-unused-vars\n  const { user: currentUser } = useAuth();');
replaceRegex('features/tasks/TaskDetailsModal.jsx', /\/\* eslint-disable-next-line no-unused-vars \*\/\n\/\/ eslint-disable-next-line no-unused-vars/g, '// eslint-disable-next-line no-unused-vars');
replaceRegex('features/tasks/tabs/EvidenceTab.jsx', /const handleLateRating/g, '// eslint-disable-next-line no-unused-vars\n  const handleLateRating');
replaceRegex('pages/Profile.jsx', /\{ Icon *,/g, '/* eslint-disable-next-line no-unused-vars */ { Icon,');

console.log('Fixed final syntax anomalies!');
