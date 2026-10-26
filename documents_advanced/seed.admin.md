
async function seedAdmin() {
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);
 

  const existingAdmin = await userRepository.findOne({
    where: {
      email: 'admin@example.com',
    },
  });

  if (existingAdmin) {
    console.log('Admin already exists');
    await AppDataSource.destroy();
    return;
  }

  const password = await bcrypt.hash('Admin@123', 10);

  const admin = userRepository.create({
    name: 'Admin',
    email: 'admin@example.com',
    password,
    role: UserRole.ADMIN,
  });

  await userRepository.save(admin);

  console.log('Admin created successfully');

  await AppDataSource.destroy();
}

seedAdmin();

> here getRepository(User) gives us repository methods for querying and saving users  
> using an enum provide a consistent type-checked role value and avoids 


- await AppDataSource.initialize(); 
> this initializes the TypeORM dataSource using configuration in data-source
> here reads the postgresQl connection details , entity configuration and database settings 

seedAdmin()
    ↓
Initialize DataSource
    ↓
Connect to PostgreSQL
    ↓
Continue only after initialization succeeds

