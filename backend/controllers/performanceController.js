const Performance = require('../models/Performance');
const User = require('../models/User');
const moment = require('moment');

exports.giveMarks = async (req, res) => {
  try {
    const { evaluateeId, criteriaMarks } = req.body;
    const evaluatorId = req.user._id;

    const evaluator = await User.findById(evaluatorId);
    const evaluatee = await User.findById(evaluateeId);

    if (!evaluator || !evaluatee) {
      return res.status(404).json({ message: 'Evaluator or evaluatee not found.' });
    }

    const now = moment();
    const month = now.month() + 1;
    const year = now.year();

    const evaluatorRole = evaluator.role;
    const evaluateeRole = evaluatee.role;
    const evaluatorDept = evaluator.departments[0];
    const evaluateeDept = evaluatee.departments[0];

    // ❌ Block director/president
    if (['Director', 'President Operations'].includes(evaluatorRole)) {
      return res.status(403).json({ message: 'Director or President cannot evaluate.' });
    }

    // ✅ 30-day cooldown check
    const thirtyDaysAgo = moment().subtract(30, 'days');
    const recentEvaluation = await Performance.findOne({
      evaluator: evaluatorId,
      evaluatee: evaluateeId,
      createdAt: { $gte: thirtyDaysAgo.toDate() }
    });

    if (recentEvaluation) {
      return res.status(403).json({ message: 'You can only evaluate this employee once every 30 days.' });
    }

    // ✅ Authority mapping (same as before)
    let allowed = false;

    if (evaluatorRole === 'Quality Head' &&
      (evaluateeRole === 'QA Head' || evaluateeRole === 'QC Head')) {
      allowed = true;
    } else if (evaluatorRole === 'Plant Head' &&
      evaluateeRole === 'Head' &&
      !['QA', 'QC'].includes(evaluateeDept)) {
      allowed = true;
    } else if (evaluatorRole === 'Head' &&
      evaluateeRole === 'Staff' &&
      evaluatorDept === evaluateeDept) {
      allowed = true;
    } else if (evaluatorRole === 'Staff' &&
      evaluateeRole === 'Head' &&
      evaluatorDept === evaluateeDept) {
      allowed = true;
    } else if (evaluatorRole === 'Head') {
      if (
        ['QA', 'QC'].includes(evaluatorDept) &&
        evaluateeRole === 'Quality Head'
      ) {
        allowed = true;
      } else if (
        !['QA', 'QC'].includes(evaluatorDept) &&
        evaluateeRole === 'Plant Head'
      ) {
        allowed = true;
      }
    }

    if (!allowed) {
      return res.status(403).json({ message: 'You are not allowed to evaluate this user.' });
    }

    // ✅ Total marks check
    const total = Object.values(criteriaMarks).reduce((sum, val) => sum + val, 0);
    if (total > 100) {
      return res.status(400).json({ message: 'Total marks cannot exceed 100.' });
    }

    const performance = new Performance({
      evaluator: evaluatorId,
      evaluatee: evaluateeId,
      department: evaluateeDept,
      criteriaMarks,
      total,
      month,
      year,
    });

    await performance.save();
    res.json({ message: 'Marks submitted successfully.' });
  } catch (err) {
    console.error('Error in giveMarks:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};



// ✅ Staff view own marks
exports.viewMyMarks = async (req, res) => {
  try {
    const performance = await Performance.find({ evaluatee: req.user._id })
      .populate('evaluator', 'name designation')
      .sort({ year: -1, month: -1 });

    const detailed = performance.map(entry => ({
      month: entry.month,
      year: entry.year,
      evaluator: entry.evaluator,
      total: entry.total,
      criteriaMarks: entry.criteriaMarks
    }));

    const totalScored = performance.reduce((sum, p) => sum + p.total, 0);
    const maxPossible = performance.length * 100;

    res.json({
      totalScored,
      maxPossible,
      percentage: ((totalScored / maxPossible) * 100).toFixed(2),
      history: detailed
    });
  } catch (err) {
    console.error('Error fetching own marks:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ✅ Admin/Director: view all marks
exports.getPerformanceSummary = async (req, res) => {
  try {
    const all = await Performance.find().populate('evaluatee evaluator', 'name designation department');
    res.json(all);
  } catch (err) {
    console.error('Error fetching summary:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
