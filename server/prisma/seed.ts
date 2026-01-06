import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create users
    const managerPassword = await bcrypt.hash('manager123', 10);
    const designerPassword = await bcrypt.hash('designer123', 10);
    const sellerPassword = await bcrypt.hash('seller123', 10);
    const csPassword = await bcrypt.hash('cs123', 10);

    const manager = await prisma.user.upsert({
        where: { email: 'manager@dtc.com' },
        update: {},
        create: {
            email: 'manager@dtc.com',
            password: managerPassword,
            name: 'DTC Manager',
            role: Role.MANAGER,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
        },
    });

    const designer = await prisma.user.upsert({
        where: { email: 'tu@dtc.com' },
        update: {},
        create: {
            email: 'tu@dtc.com',
            password: designerPassword,
            name: 'Designer [Tư]',
            role: Role.DESIGNER,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tu',
        },
    });

    const seller1 = await prisma.user.upsert({
        where: { email: 'huyen@dtc.com' },
        update: {},
        create: {
            email: 'huyen@dtc.com',
            password: sellerPassword,
            name: 'Seller 1 [Huyền]',
            role: Role.SELLER,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huyen',
        },
    });

    const seller2 = await prisma.user.upsert({
        where: { email: 'tam@dtc.com' },
        update: {},
        create: {
            email: 'tam@dtc.com',
            password: sellerPassword,
            name: 'Seller 2 [Tâm]',
            role: Role.SELLER,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tam',
        },
    });

    const csDao = await prisma.user.upsert({
        where: { email: 'dao@dtc.com' },
        update: {},
        create: {
            email: 'dao@dtc.com',
            password: csPassword,
            name: 'CS [Đào]',
            role: Role.CS,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dao',
        },
    });

    const csThao = await prisma.user.upsert({
        where: { email: 'thao@dtc.com' },
        update: {},
        create: {
            email: 'thao@dtc.com',
            password: csPassword,
            name: 'CS [Thảo]',
            role: Role.CS,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=thao',
        },
    });

    console.log('✅ Users created');

    // Create sample tasks
    const task1 = await prisma.task.create({
        data: {
            title: 'Check file Fulfillment [Ưu Tiên]',
            purpose: 'Đảm bảo tiến độ fulfillment hàng ngày và xử lý các yêu cầu thiết kế khẩn cấp.',
            description: 'Check file ưu tiên để fulfill (Clone file, redesign, chỉnh sửa file, scale temp, thiết kế theo yêu cầu của khách)',
            assignedToId: designer.id,
            createdById: manager.id,
            role: Role.DESIGNER,
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            progress: 40,
            deadline: new Date(Date.now() + 86400000), // Tomorrow
            updateLogs: {
                create: {
                    field: 'Task',
                    oldValue: 'None',
                    newValue: 'Created',
                    details: 'Initial task creation',
                },
            },
        },
    });

    const task2 = await prisma.task.create({
        data: {
            title: 'Research trending và triển khai',
            purpose: 'Tìm kiếm nhân vật và đặc điểm đạt hot topic trending để mở rộng danh mục sản phẩm.',
            description: 'Phân tích nhân vật đặc điểm đạt hot topic trending (movie, cartoon, anime)',
            assignedToId: seller1.id,
            createdById: manager.id,
            role: Role.SELLER,
            status: 'TODO',
            priority: 'MEDIUM',
            progress: 0,
            deadline: new Date(Date.now() + 172800000), // 2 days
            updateLogs: {
                create: {
                    field: 'Task',
                    oldValue: 'None',
                    newValue: 'Created',
                },
            },
        },
    });

    const task3 = await prisma.task.create({
        data: {
            title: 'Fulfill đơn hàng mới',
            purpose: 'Xử lý đơn hàng mới trong ngày',
            description: 'Check và fulfill các đơn hàng mới từ tất cả các store',
            assignedToId: csDao.id,
            createdById: manager.id,
            role: Role.CS,
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            progress: 60,
            deadline: new Date(Date.now() + 43200000), // 12 hours
            updateLogs: {
                create: {
                    field: 'Task',
                    oldValue: 'None',
                    newValue: 'Created',
                },
            },
        },
    });

    console.log('✅ Sample tasks created');

    console.log('\n📝 Seed data summary:');
    console.log('-----------------------------------');
    console.log('Users created:');
    console.log(`  Manager: manager@dtc.com / manager123`);
    console.log(`  Designer: tu@dtc.com / designer123`);
    console.log(`  Seller 1: huyen@dtc.com / seller123`);
    console.log(`  Seller 2: tam@dtc.com / seller123`);
    console.log(`  CS Đào: dao@dtc.com / cs123`);
    console.log(`  CS Thảo: thao@dtc.com / cs123`);
    console.log('\nSample tasks created: 3');
    console.log('-----------------------------------\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
