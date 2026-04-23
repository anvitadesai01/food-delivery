const express = require('express');
const router = express.Router();

const {protectJWT} = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

const {
  getAllMenuItems,
  getAdminMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/menuItem.controller');
const validate = require('../middlewares/validate.middleware');
const { createMenuItemSchema } = require('../validators/menuItem.validator');

router.get('/admin/all', protectJWT, authorize('admin'), getAdminMenuItems);
router.get('/', getAllMenuItems);

router.post('/', protectJWT, authorize('admin'),validate(createMenuItemSchema), createMenuItem);


router.put('/:id', protectJWT, authorize('admin'), updateMenuItem);


router.delete('/:id', protectJWT, authorize('admin'), deleteMenuItem);

module.exports = router;
