// דוגמה מתוך middleware/auth.js
function authenticateAdmin(req, res, next) {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    
    if (req.session.user.role !== 'admin') {
      return res.status(403).send('אין לך הרשאה לגשת לעמוד זה');
    }
    
    req.user = req.session.user;
    next();
  }
  
  function authenticateInstitution(req, res, next) {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    
    if (req.session.user.role !== 'institution') {
      return res.status(403).send('אין לך הרשאה לגשת לעמוד זה');
    }
    
    req.user = req.session.user;
    next();
  }