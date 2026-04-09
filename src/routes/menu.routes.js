const express = require('express');
const router = express.Router();

const protect = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

const {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuItem.controller');
const validate = require('../middlewares/validate.middleware');
const { createMenuItemSchema } = require('../validators/menuItem.validator');


router.post('/', protect, authorize('admin'),validate(createMenuItemSchema), createMenuItem);


router.put('/:id', protect, authorize('admin'), updateMenuItem);


router.delete('/:id', protect, authorize('admin'), deleteMenuItem);

module.exports = router;