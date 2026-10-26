import { User } from "../../users/entities/user.entity";
import { UserRole } from "../../users/enum/roles.enum";
import { orderDataSource } from "../data-source";
import * as bcrypt from 'bcrypt'


async function seedAdmin(){
    await orderDataSource.initialize();

    const UserRepository = orderDataSource.getRepository(User);

    const existingAdmin = await UserRepository.findOne({
    where: {
      email: 'admin@example.com',
    },
  });

  if (existingAdmin) {
    console.log('Admin already exists');
    await orderDataSource.destroy();
    return;
  }

    const password = await bcrypt.hash('Admin@123',10);

    const admin = UserRepository.create({
        name : 'Admin',
        email : 'admin@gmail.com',
        password,
        role : UserRole.Admin
    });

    await UserRepository.save(admin);

    await orderDataSource.destroy()
}

seedAdmin()