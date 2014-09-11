'use strict';
// Load liferay-sdk tasks
try { require('require-dir')('node_modules/liferay-sdk/tasks'); } catch (err) {}
// Load custom tasks from the `tasks` directory
try { require('require-dir')('tasks'); } catch (err) {}
