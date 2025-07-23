const express = require('express');
const router = express.Router();
const Record = require('../models/Record');
const {requireApiKey, checkAccessLevel} = require('../middleware/auth');
const { isDateString } = require('../utils/date');

const formatRecord = (obj) => {
  delete obj._id;
  delete obj.__v;
  delete obj.application_key;
  delete obj.user_custom_category;
  delete obj.type;
  obj.id = obj.data_id;
  delete obj.data_id;
  delete obj.user_id;

  obj.createdAt = obj.createdAt.toISOString();
  obj.lastChangeAt = obj.lastChangeAt.toISOString();
  return obj;
};

const formatResponse = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    if (data && data.records) {
      data.records = data.records.map(formatRecord);
    } else if (data && !data.message) {
      formatRecord(data);
    }
    return originalJson.call(this, data);
  };
  next();
};

router.use(formatResponse);

// CREATE - Post a new record with optional category
router.post('/:category?', requireApiKey,checkAccessLevel, async (req, res) => {
  try {
    const category = req.params.category || 'global'; // Default to "global"

    const newRecord = new Record({
      ...req.body,
      data_id: Date.now() * (Math.floor(Math.random() * 1000) + 1),
      application_key: req.api_key,
      user_custom_category: category,
      user_id : req.user?._id ?? null,
      createdAt: new Date(),
      lastChangeAt : new Date(),
      type: "record"
    });

    if(category === 'bl'){
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const blValue =
        pad(now.getDate()) +
        pad(now.getMonth() + 1) +
        now.getFullYear() +
        pad(now.getHours()) +
        pad(now.getMinutes()) +
        pad(now.getSeconds()) +
        (Math.floor(Math.random() * 90) + 10);
      newRecord.blNumber = blValue;
    }

    const savedRecord = await newRecord.save();
    res.status(201).json(savedRecord.toObject());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// READ - Get all records with sorting, filtering, pagination, and optional category
router.get('/:category?', requireApiKey,checkAccessLevel, async (req, res) => {
  try {
    const category = req.params.category || 'global'; // Default to "global"
    const { 
      sortBy, 
      order, 
      page, 
      limit,
      filterMin,
      filterMax,
      searchKey,
      searchValue,
      mine
    } = req.query;

    const filterKey = req.query.filterKey === 'id' ? 'data_id' : req.query.filterKey
    const filterValue = req.query.filterValue;
    
    let query = { 
      application_key: req.api_key,
      user_custom_category: category,
    };

    if(mine === 'true'){
      query.user_id = req.user._id.toString()
    }

    if (filterKey) {
      if (filterMin !== undefined || filterMax !== undefined) {
        query[filterKey] = {};
        if (filterMin !== undefined) {
          query[filterKey].$gte = isDateString(filterMin) ? new Date(filterMin) : Number(filterMin);
        }
        if (filterMax !== undefined) {
          query[filterKey].$lte = isDateString(filterMax) ? new Date(filterMax) : Number(filterMax);
        }
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

    if (searchKey && searchValue) {
      query[searchKey] = { $regex: new RegExp(searchValue, 'i') };
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
    
    res.json({
      records: records.map(r => r.toObject()),
      totalRecords: total,
      ...(limit ? {
        currentPage: Number(page || 1),
        totalPages: Math.ceil(total / Number(limit)),
        recordsPerPage: Number(limit),
      } : {
        currentPage: 1,
        totalPages: 1,
        recordsPerPage: Infinity,
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

// READ - Get a single record by ID with optional category
router.get('/:category/:id', requireApiKey,checkAccessLevel, async (req, res) => {
  try {
    const category = req.params.category || 'global'; // Default to "global"
    const record = await Record.findOne({
      data_id: Number(req.params.id),
      application_key: req.api_key,
      user_custom_category: category,
    });

    if (record) {
      res.json(record.toObject());
    } else {
      res.status(404).json({ message: 'Record not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE - Update a record by ID with optional category
router.put('/:category/:id', requireApiKey,checkAccessLevel, async (req, res) => {
  const {data_id , application_key , user_custom_category , user_id, lastChangeAt, createdAt, bl  , ...data} = req.body
  try {
    const category = req.params.category || 'global'; // Default to "global"
    const updatedRecord = await Record.findOneAndUpdate(
      {
        data_id: Number(req.params.id),
        application_key: req.api_key,
        user_custom_category: category,
        user_id : req.user_id
      },
      {
        ...data,
        lastChangeAt : new Date(),
      },
      { new: true }
    );

    if (updatedRecord) {
      res.json(updatedRecord.toObject());
    } else {
      res.status(404).json({ message: 'Record not found or unauthorized' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// DELETE ALL - Delete all records for a specific user with optional category
router.delete('/:category/delete-all', requireApiKey,checkAccessLevel, async (req, res) => {
    try {
      const category = req.params.category || 'global'; // Default to "global"
      const result = await Record.deleteMany({ 
        application_key: req.api_key,
        user_custom_category: category
      });
  
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

// DELETE - Delete a record by ID with optional category
router.delete('/:category/:id', requireApiKey,checkAccessLevel, async (req, res) => {
  try {
    const category = req.params.category || 'global'; // Default to "global"
    const deletedRecord = await Record.findOneAndDelete({
      data_id: Number(req.params.id),
      application_key: req.api_key,
      user_custom_category: category
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

module.exports = router; 
