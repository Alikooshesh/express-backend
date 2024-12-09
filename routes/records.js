const express = require('express');
const router = express.Router();
const Record = require('../models/Record');
const requireApiKey = require('../middleware/auth');

// CREATE - Post a new record
router.post('/', requireApiKey, async (req, res) => {
  try {
    const newRecord = new Record({
      ...req.body,
      id: Date.now() * (Math.floor(Math.random() * 1000) + 1),
      user_key: req.api_key,
      createdAt: new Date()
    });
    const savedRecord = await newRecord.save();
    const response = savedRecord.toObject();
    delete response.__v;
    delete response.user_key;
    delete response._id;
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// READ - Get all records with sorting, filtering and pagination
router.get('/', requireApiKey, async (req, res) => {
  try {
    const { 
      sortBy, 
      order, 
      page, 
      limit,
      filterKey,
      filterMin,
      filterMax 
    } = req.query;

    const filterValue = req.query.filterValue;
    
    let query = { user_key: req.api_key };

    if (filterKey) {
      if (filterMin !== undefined || filterMax !== undefined) {
        query[filterKey] = {};
        if (filterMin !== undefined) query[filterKey].$gte = Number(filterMin);
        if (filterMax !== undefined) query[filterKey].$lte = Number(filterMax);
      }
      else if (filterValue) {
        if (Array.isArray(filterValue)) {
          if (filterValue.some(v => v.toLowerCase() === 'true' || v.toLowerCase() === 'false')) {
            const boolValue = filterValue[0].toLowerCase() === 'true';
            query[filterKey] = boolValue;
          } else {
            query[filterKey] = { $in: filterValue };
          }
        }
        else if (filterValue.includes(',')) {
          const values = filterValue.split(',');
          query[filterKey] = { $in: values };
        }
        else if (filterValue.toLowerCase() === 'true' || filterValue.toLowerCase() === 'false') {
          query[filterKey] = filterValue.toLowerCase() === 'true';
        }
        else {
          query[filterKey] = filterValue;
        }
      }
    }

    let findQuery = Record.find(query);

    if (sortBy) {
      const sortOrder = order?.toLowerCase() === 'desc' ? -1 : 1;
      findQuery = findQuery.sort({ [sortBy]: sortOrder });
    }

    if (limit) {
      const skip = ((page || 1) - 1) * limit;
      findQuery = findQuery.skip(skip).limit(Number(limit));
    }

    const [records, total] = await Promise.all([
      findQuery,
      Record.countDocuments(query)
    ]);

    const formattedRecords = records.map(record => {
      const obj = record.toObject();
      delete obj._id;
      delete obj.__v;
      delete obj.user_key;
      return obj;
    });

    res.json({
      records: formattedRecords,
      totalRecords: total,
      ...(!limit ? {
        currentPage: 1,
        totalPages: 1,
        recordsPerPage: Infinity,
      } : {
        currentPage: Number(page || 1),
        totalPages: Math.ceil(total / Number(limit)),
        recordsPerPage: Number(limit)
      }),
      appliedFilters: filterKey ? {
        filterKey,
        filterValue: Array.isArray(filterValue) ? filterValue : [filterValue],
        filterMin,
        filterMax
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// READ - Get a single record by ID
router.get('/:id', requireApiKey, async (req, res) => {
  try {
    const record = await Record.findOne({
      id: Number(req.params.id),  // Convert to number since IDs are timestamps
      user_key: req.api_key
    });

    if (record) {
      const response = record.toObject();
      delete response.__v;
      delete response.user_key;
      delete response._id;
      res.json(response);
    } else {
      res.status(404).json({ message: 'Record not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE - Update a record by ID
router.put('/:id', requireApiKey, async (req, res) => {
  try {
    const updatedRecord = await Record.findOneAndUpdate(
      {
        id: Number(req.params.id),
        user_key: req.api_key
      },
      req.body,
      { new: true }
    );

    if (updatedRecord) {
      const response = updatedRecord.toObject();
      delete response.__v;
      delete response.user_key;
      delete response._id;
      res.json(response);
    } else {
      res.status(404).json({ message: 'Record not found or unauthorized' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE - Delete a record by ID
router.delete('/:id', requireApiKey, async (req, res) => {
  try {
    const deletedRecord = await Record.findOneAndDelete({
      id: Number(req.params.id),
      user_key: req.api_key
    });

    if (deletedRecord) {
      res.json({ message: 'Record deleted successfully' });
    } else {
      res.status(404).json({ message: 'Record not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE ALL - Delete all records for a specific user
router.delete('/', requireApiKey, async (req, res) => {
  try {
    const result = await Record.deleteMany({ user_key: req.api_key });

    if (result.deletedCount > 0) {
      res.json({ 
        message: 'Records deleted successfully', 
        deletedCount: result.deletedCount 
      });
    } else {
      res.status(404).json({ 
        message: 'No records found for this user',
        deletedCount: 0
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 