const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'database.json');

// Initialize data structure
const initialData = {
  users: [],
  assets: [],
  licenses: [],
  tickets: [],
  knowledgeBases: [],
  onboardings: [],
  offboardings: [],
  procurements: [],
  floorplans: [],
  auditLogs: []
};

class DataStore {
  constructor() {
    this.data = { ...initialData };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error loading database.json, resetting:', err);
      this.data = { ...initialData };
      this.save();
    }
  }

  save() {
    try {
      if (!fs.existsSync(path.dirname(DATA_FILE))) {
        fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving database.json:', err);
    }
  }

  collection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return {
      find: (filter = {}) => {
        let items = this.data[name];
        if (typeof filter === 'function') {
          return items.filter(filter);
        }
        return items.filter(item => {
          for (let key in filter) {
            if (item[key] !== filter[key]) return false;
          }
          return true;
        });
      },
      findOne: (filter = {}) => {
        let items = this.data[name];
        if (typeof filter === 'function') {
          return items.find(filter) || null;
        }
        return items.find(item => {
          for (let key in filter) {
            if (item[key] !== filter[key]) return false;
          }
          return true;
        }) || null;
      },
      findById: (id) => {
        return this.data[name].find(item => String(item._id || item.id) === String(id)) || null;
      },
      insert: (doc) => {
        const newDoc = {
          _id: doc._id || 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...doc
        };
        this.data[name].unshift(newDoc);
        this.save();
        return newDoc;
      },
      findByIdAndUpdate: (id, update) => {
        const index = this.data[name].findIndex(item => String(item._id || item.id) === String(id));
        if (index === -1) return null;
        this.data[name][index] = {
          ...this.data[name][index],
          ...update,
          updatedAt: new Date().toISOString()
        };
        this.save();
        return this.data[name][index];
      },
      findByIdAndDelete: (id) => {
        const index = this.data[name].findIndex(item => String(item._id || item.id) === String(id));
        if (index === -1) return null;
        const deleted = this.data[name].splice(index, 1)[0];
        this.save();
        return deleted;
      },
      count: (filter = {}) => {
        return this.collection(name).find(filter).length;
      },
      replaceData: (items) => {
        this.data[name] = items;
        this.save();
      }
    };
  }
}

const store = new DataStore();
module.exports = store;
