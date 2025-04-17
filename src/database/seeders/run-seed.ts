import { databaseService } from '../services/database.service';

databaseService.runSeed()
  .then(success => {
    console.log(`Database seeding ${success ? 'succeeded' : 'failed'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Seeding error:', error);
    process.exit(1);
  });