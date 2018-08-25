// @flow
import 'babel-polyfill';
import dotenv from 'dotenv';
import { exec } from 'child_process';

import app, { startServer, shutdownServer } from './server';

import { synchronizeGitHubBoard } from './sync';

dotenv.load();

exec('open ./menu-bar-app/build/things-sync.app');

app.get('/test', async (req, res) => {
  res.send('test passed');
  await Promise.all(process.env.GITHUB_PROJECT_IDS.split(',').map(synchronizeGitHubBoard));
});

app.get('/exit', (req, res) => {
  // eslint-disable-next-line no-console
  console.log('shutting down server');
  res.send('shutting down server');
  shutdownServer();
});

startServer();
