import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import crypto from 'node:crypto';

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const db = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = 'restaurant_app_salt_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

function getUniqueImageUrl(dishName: string, basePhotoId: string): string {
  const slug = dishName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `https://images.unsplash.com/${basePhotoId}?auto=format&fit=crop&w=800&q=80&dish=${slug}`;
}

async function main() {
  console.log('🌱 Seeding database from JHON RESTAURANT menu PDF with exact Full & Half prices...');

  // Clean existing data
  await db.payment.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.dish.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany();
  await db.visitLog.deleteMany();

  // Create Users
  const adminPassword = hashPassword('admin123');
  const managerPassword = hashPassword('manager123');
  const chefPassword = hashPassword('chef123');

  await db.user.create({
    data: {
      name: 'Jhon Admin',
      email: 'admin@restaurant.com',
      phone: '+919876543210',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'APPROVED',
    },
  });

  await db.user.create({
    data: {
      name: 'Sarah Connor (Floor Manager)',
      email: 'manager@restaurant.com',
      phone: '+919876543211',
      passwordHash: managerPassword,
      role: 'MANAGER',
      status: 'APPROVED',
    },
  });

  await db.user.create({
    data: {
      name: 'Head Chef Marco',
      email: 'chef@restaurant.com',
      phone: '+919876543212',
      passwordHash: chefPassword,
      role: 'CHEF',
      status: 'APPROVED',
    },
  });

  // Categories
  const catRolls = await db.category.create({ data: { name: 'Rolls & Starters', icon: 'UtensilsCrossed', sortOrder: 1 } });
  const catVegNoodle = await db.category.create({ data: { name: 'Veg Noodles', icon: 'Utensils', sortOrder: 2 } });
  const catNonVegNoodle = await db.category.create({ data: { name: 'Non-Veg Noodles', icon: 'Utensils', sortOrder: 3 } });
  const catVegRice = await db.category.create({ data: { name: 'Veg Rice', icon: 'CookingPot', sortOrder: 4 } });
  const catNonVegRice = await db.category.create({ data: { name: 'Non-Veg Rice', icon: 'CookingPot', sortOrder: 5 } });
  const catIndianCurry = await db.category.create({ data: { name: 'Indian Food Curry', icon: 'Flame', sortOrder: 6 } });
  const catBiryani = await db.category.create({ data: { name: 'Biryani Specials', icon: 'Crown', sortOrder: 7 } });
  const catRotiKabab = await db.category.create({ data: { name: 'Roti & Kababs', icon: 'Flame', sortOrder: 8 } });

  const rawDishes = [
    // ROLLS & STARTERS
    { categoryId: catRolls.id, name: 'Veg Roll', description: 'Crispy flatbread wrapped with spiced fresh garden vegetables.', price: 40, priceHalf: null, isVeg: true, photoId: 'photo-1626777552726-4a6b54c97e46' },
    { categoryId: catRolls.id, name: 'Paneer Roll', description: 'Stuffed with succulent cottage cheese cubes and mint chutney.', price: 60, priceHalf: null, isVeg: true, photoId: 'photo-1599487488170-d11ec9c172f0' },
    { categoryId: catRolls.id, name: 'Egg Roll', description: 'Fluffy egg layered paratha wrap with tangy onions and sauces.', price: 40, priceHalf: null, isVeg: false, photoId: 'photo-1627308595229-7830a5c91f9f' },
    { categoryId: catRolls.id, name: 'Double Egg Roll', description: 'Double egg layered paratha loaded with crunch and spices.', price: 50, priceHalf: null, isVeg: false, photoId: 'photo-1565299585323-38d6b0865b47' },
    { categoryId: catRolls.id, name: 'Chicken Roll', description: 'Juicy spiced chicken tikka strips rolled in a soft paratha.', price: 60, priceHalf: null, isVeg: false, photoId: 'photo-1601050690597-df0568f70950' },
    { categoryId: catRolls.id, name: 'Egg Chicken Roll', description: 'Tender chicken pieces and egg coating packed in a warm wrap.', price: 70, priceHalf: null, isVeg: false, photoId: 'photo-1606755962773-d324e0a13086' },
    { categoryId: catRolls.id, name: 'Veg Spring Roll', description: 'Golden fried crispy rolls filled with seasoned shredded veggies.', price: 60, priceHalf: null, isVeg: true, photoId: 'photo-1544025162-d76694265947' },
    { categoryId: catRolls.id, name: 'Chicken Spring Roll', description: 'Crispy wonton wrappers filled with spicy minced chicken.', price: 100, priceHalf: null, isVeg: false, photoId: 'photo-1541696432-82c6da8ce7bf' },
    { categoryId: catRolls.id, name: 'Egg Spring Roll', description: 'Crispy rolls packed with shredded egg and fresh bell peppers.', price: 80, priceHalf: null, isVeg: false, photoId: 'photo-1534422298391-e4f8c172dddb' },
    { categoryId: catRolls.id, name: 'Veg Burger', description: 'Crispy veggie patty with fresh lettuce, tomatoes, and mayo on toasted bun.', price: 50, priceHalf: null, isVeg: true, photoId: 'photo-1568901346375-23c9450c58cd' },
    { categoryId: catRolls.id, name: 'Veg Pakora (6 Pcs)', description: 'Crispy deep-fried vegetable fritters served with green mint dip.', price: 60, priceHalf: null, isVeg: true, photoId: 'photo-1601050690117-94f5f6fa8bd7' },
    { categoryId: catRolls.id, name: 'Chicken Fried Wonton', description: 'Golden fried chicken wonton dumplings with sweet chili dip.', price: 140, priceHalf: null, isVeg: false, photoId: 'photo-1563245372-f21724e3856d' },
    { categoryId: catRolls.id, name: 'Chicken Lolipop (4 Pcs)', description: 'Crispy frenching chicken wings tossed in fiery Indo-Chinese glaze.', price: 120, priceHalf: null, isVeg: false, photoId: 'photo-1567620832903-9fc6debc209f' },
    { categoryId: catRolls.id, name: 'Chicken Drumstick (4 Pcs)', description: 'Deep-fried marinated chicken leg drumsticks with spicy dip.', price: 150, priceHalf: 80, isVeg: false, photoId: 'photo-1598515214211-89d3c73ae83b' },
    { categoryId: catRolls.id, name: 'Chicken Dry Fry (7 Pcs)', description: 'Crispy tossed chicken bites cooked with garlic and green chilies.', price: 130, priceHalf: 90, isVeg: false, photoId: 'photo-1562967914-608f82629710' },
    { categoryId: catRolls.id, name: 'Chicken Pakora (6 Pcs)', description: 'Deep-fried spicy chicken fritters coated in gram flour batter.', price: 140, priceHalf: null, isVeg: false, photoId: 'photo-1626777552726-4a6b54c97e46' },
    { categoryId: catRolls.id, name: 'Veg Momo (7 Pcs)', description: 'Steamed dumpling pockets stuffed with minced cabbage, carrots & herbs.', price: 60, priceHalf: null, isVeg: true, photoId: 'photo-1625220194771-7ebdea0b70b9' },
    { categoryId: catRolls.id, name: 'Chicken Momo (7 Pcs)', description: 'Steamed Himalayan dumplings packed with seasoned chicken filling.', price: 80, priceHalf: null, isVeg: false, photoId: 'photo-1534422298391-e4f8c172dddb' },

    // VEG NOODLES
    { categoryId: catVegNoodle.id, name: 'Veg Noodles', description: 'Wok-tossed noodles with crunchy bell peppers, onions and soy sauce.', price: 90, priceHalf: 70, isVeg: true, photoId: 'photo-1585032226651-759b368d7246' },
    { categoryId: catVegNoodle.id, name: 'Veg Hakka Noodles', description: 'Classic Hakka style stir-fried noodles with fresh spring vegetables.', price: 100, priceHalf: 80, isVeg: true, photoId: 'photo-1612927601601-6638404737ce' },
    { categoryId: catVegNoodle.id, name: 'Veg Schezwan Noodles', description: 'Spicy wok noodles tossed in fiery red Schezwan chili paste.', price: 100, priceHalf: 80, isVeg: true, photoId: 'photo-1569718212165-3a8278d5f624' },
    { categoryId: catVegNoodle.id, name: 'Veg Hongkong Noodle', description: 'Sweet and spicy Hongkong style tossed noodles with exotic veggies.', price: 100, priceHalf: 80, isVeg: true, photoId: 'photo-1552611052-33e04de081de' },
    { categoryId: catVegNoodle.id, name: 'Veg Singapore Noodles', description: 'Curry flavored noodles stir-fried with julienned vegetables.', price: 100, priceHalf: 80, isVeg: true, photoId: 'photo-1540420773420-3366772f4999' },
    { categoryId: catVegNoodle.id, name: 'Veg Triple Noodles', description: 'Unique combo of fried noodles, gravy curry and rice mix.', price: 100, priceHalf: 80, isVeg: true, photoId: 'photo-1569718212165-3a8278d5f624' },
    { categoryId: catVegNoodle.id, name: 'Veg Garlic Noodles', description: 'Aromatic noodles wok-tossed with burnt garlic and green onions.', price: 100, priceHalf: 80, isVeg: true, photoId: 'photo-1612927601601-6638404737ce' },
    { categoryId: catVegNoodle.id, name: 'Veg Fortune Noodles', description: 'Chef special veg noodles cooked in house fortune sauce.', price: 100, priceHalf: 80, isVeg: true, photoId: 'photo-1585032226651-759b368d7246' },
    { categoryId: catVegNoodle.id, name: 'Veg Combination Noodles', description: 'Mixed veg noodles with crispy noodle topping.', price: 100, priceHalf: 80, isVeg: true, photoId: 'photo-1552611052-33e04de081de' },
    { categoryId: catVegNoodle.id, name: 'Veg Paneer Noodles', description: 'Stir-fried noodles loaded with golden paneer cottage cheese cubes.', price: 120, priceHalf: 90, isVeg: true, photoId: 'photo-1540420773420-3366772f4999' },
    { categoryId: catVegNoodle.id, name: 'Veg Mushroom Noodles', description: 'Savory noodles tossed with fresh button mushrooms and garlic herbs.', price: 120, priceHalf: 90, isVeg: true, photoId: 'photo-1585032226651-759b368d7246' },
    { categoryId: catVegNoodle.id, name: 'Veg Mix Noodle', description: 'Loaded noodles stir-fried with paneer, mushroom, and fresh veggies.', price: 140, priceHalf: 110, isVeg: true, photoId: 'photo-1569718212165-3a8278d5f624' },

    // NON-VEG NOODLES
    { categoryId: catNonVegNoodle.id, name: 'Egg Noodles', description: 'Flavorful wok-tossed noodles scrambled with farm fresh eggs.', price: 110, priceHalf: 80, isVeg: false, photoId: 'photo-1569718212165-3a8278d5f624' },
    { categoryId: catNonVegNoodle.id, name: 'Egg Schezwan Noodle', description: 'Spicy egg noodles wok tossed in Schezwan red pepper dip.', price: 120, priceHalf: 90, isVeg: false, photoId: 'photo-1612927601601-6638404737ce' },
    { categoryId: catNonVegNoodle.id, name: 'Egg Hongkong Noodle', description: 'Hongkong style egg chowmein with tangy soy glaze.', price: 120, priceHalf: 90, isVeg: false, photoId: 'photo-1552611052-33e04de081de' },
    { categoryId: catNonVegNoodle.id, name: 'Egg Singapore Noodle', description: 'Curry spiced egg noodles tossed with crunchy onions and peppers.', price: 120, priceHalf: 90, isVeg: false, photoId: 'photo-1540420773420-3366772f4999' },
    { categoryId: catNonVegNoodle.id, name: 'Egg Triple Noodle', description: 'Triple combination of egg noodles, egg fried rice, and Manchurian gravy.', price: 130, priceHalf: 100, isVeg: false, photoId: 'photo-1585032226651-759b368d7246' },
    { categoryId: catNonVegNoodle.id, name: 'Chicken Noodle', description: 'Stir-fried noodles loaded with shredded tender chicken pieces.', price: 130, priceHalf: 70, isVeg: false, photoId: 'photo-1569718212165-3a8278d5f624' },
    { categoryId: catNonVegNoodle.id, name: 'Chicken Hakka Noodle', description: 'Indo-Chinese Hakka noodles with juicy chicken strips and scallions.', price: 140, priceHalf: 100, isVeg: false, photoId: 'photo-1612927601601-6638404737ce' },
    { categoryId: catNonVegNoodle.id, name: 'Chicken Schezwan Noodle', description: 'Fiery chicken noodles cooked in authentic spicy Schezwan sauce.', price: 140, priceHalf: 100, isVeg: false, photoId: 'photo-1552611052-33e04de081de' },
    { categoryId: catNonVegNoodle.id, name: 'Chicken Hongkong Noodle', description: 'Sweet & spicy chicken chowmein with rich dark soy finish.', price: 140, priceHalf: 100, isVeg: false, photoId: 'photo-1540420773420-3366772f4999' },
    { categoryId: catNonVegNoodle.id, name: 'Chicken Singapore Noodle', description: 'Singapore style curry aromatic noodles with chicken and eggs.', price: 140, priceHalf: 100, isVeg: false, photoId: 'photo-1585032226651-759b368d7246' },
    { categoryId: catNonVegNoodle.id, name: 'Chicken Triple Noodle', description: 'Triple delight of chicken rice, chicken noodles, and spicy gravy.', price: 150, priceHalf: 110, isVeg: false, photoId: 'photo-1569718212165-3a8278d5f624' },
    { categoryId: catNonVegNoodle.id, name: 'Chicken Garlic Noodle', description: 'Chicken noodles wok tossed with generous roasted garlic cloves.', price: 140, priceHalf: 100, isVeg: false, photoId: 'photo-1612927601601-6638404737ce' },
    { categoryId: catNonVegNoodle.id, name: 'Chicken Fortune Noodle', description: 'Chef special chicken noodles with exotic veggies.', price: 150, priceHalf: 110, isVeg: false, photoId: 'photo-1552611052-33e04de081de' },
    { categoryId: catNonVegNoodle.id, name: 'Chicken Combination Noodle', description: 'Mixed chicken and egg noodles topped with crispy noodles.', price: 140, priceHalf: 100, isVeg: false, photoId: 'photo-1540420773420-3366772f4999' },
    { categoryId: catNonVegNoodle.id, name: 'Mix Chicken Fried Noodle', description: 'Chef special noodles packed with double chicken, egg, and extra sauce.', price: 160, priceHalf: 120, isVeg: false, photoId: 'photo-1585032226651-759b368d7246' },

    // VEG RICE
    { categoryId: catVegRice.id, name: 'Veg Fried Rice', description: 'Aromatic basmati rice tossed with diced carrots, beans, and spring onion.', price: 90, priceHalf: 70, isVeg: true, photoId: 'photo-1603133872878-684f208fb84b' },
    { categoryId: catVegRice.id, name: 'Veg Schezwan Rice', description: 'Spicy stir-fried veg rice imbued with tangy red Schezwan chili paste.', price: 110, priceHalf: 80, isVeg: true, photoId: 'photo-1512058564366-18510be2db19' },
    { categoryId: catVegRice.id, name: 'Veg Hongkong Rice', description: 'Hongkong style fried rice with sweet corn, peppers & soy glaze.', price: 110, priceHalf: 80, isVeg: true, photoId: 'photo-1596797038530-2c107229654b' },
    { categoryId: catVegRice.id, name: 'Veg Singapore Rice', description: 'Curry flavored wok fried rice tossed with bell peppers.', price: 110, priceHalf: 80, isVeg: true, photoId: 'photo-1536304929831-ee1ca9d44906' },
    { categoryId: catVegRice.id, name: 'Veg Triple Rice', description: 'Combo of veg fried rice, crispy noodles & Manchurian gravy.', price: 110, priceHalf: 80, isVeg: true, photoId: 'photo-1516684732162-798a0062be99' },
    { categoryId: catVegRice.id, name: 'Veg Garlic Rice', description: 'Aromatic fried rice with roasted garlic bits and scallions.', price: 110, priceHalf: 80, isVeg: true, photoId: 'photo-1541544741938-0af808871cc0' },
    { categoryId: catVegRice.id, name: 'Veg Fortune Rice', description: 'House special fortune spice blend wok rice with vegetables.', price: 110, priceHalf: 80, isVeg: true, photoId: 'photo-1596797038530-2c107229654b' },
    { categoryId: catVegRice.id, name: 'Veg Combination Rice', description: 'Vegetable fried rice blended with crispy noodle topping.', price: 110, priceHalf: 80, isVeg: true, photoId: 'photo-1536304929831-ee1ca9d44906' },
    { categoryId: catVegRice.id, name: 'Veg Paneer Fried Rice', description: 'Fluffy fried rice tossed with crispy paneer cubes and mild spices.', price: 120, priceHalf: 90, isVeg: true, photoId: 'photo-1603133872878-684f208fb84b' },
    { categoryId: catVegRice.id, name: 'Veg Mushroom Fried Rice', description: 'Fragrant fried rice loaded with fresh button mushroom slices.', price: 120, priceHalf: 90, isVeg: true, photoId: 'photo-1512058564366-18510be2db19' },
    { categoryId: catVegRice.id, name: 'Veg Mix Fried Rice', description: 'Supreme veg fried rice packed with paneer, mushrooms & veggies.', price: 140, priceHalf: 110, isVeg: true, photoId: 'photo-1541544741938-0af808871cc0' },

    // NON-VEG RICE
    { categoryId: catNonVegRice.id, name: 'Egg Fried Rice', description: 'Classic wok-fried rice tossed with scrambled eggs and garden greens.', price: 110, priceHalf: 80, isVeg: false, photoId: 'photo-1603133872878-684f208fb84b' },
    { categoryId: catNonVegRice.id, name: 'Egg Schezwan Rice', description: 'Spicy egg fried rice seasoned with fiery Schezwan paste.', price: 120, priceHalf: 90, isVeg: false, photoId: 'photo-1512058564366-18510be2db19' },
    { categoryId: catNonVegRice.id, name: 'Egg Hongkong Rice', description: 'Egg fried rice cooked in sweet & savory Hongkong soy sauce.', price: 120, priceHalf: 90, isVeg: false, photoId: 'photo-1596797038530-2c107229654b' },
    { categoryId: catNonVegRice.id, name: 'Egg Singapore Rice', description: 'Mild curry infused egg fried rice with crisp vegetables.', price: 120, priceHalf: 90, isVeg: false, photoId: 'photo-1536304929831-ee1ca9d44906' },
    { categoryId: catNonVegRice.id, name: 'Egg Triple Rice', description: 'Egg fried rice, egg noodles and savory Manchurian sauce bowl.', price: 130, priceHalf: 100, isVeg: false, photoId: 'photo-1516684732162-798a0062be99' },
    { categoryId: catNonVegRice.id, name: 'Chicken Fried Rice', description: 'High-fire wok rice loaded with succulent boneless chicken bits.', price: 130, priceHalf: 70, isVeg: false, photoId: 'photo-1603133872878-684f208fb84b' },
    { categoryId: catNonVegRice.id, name: 'Chicken Schezwan Rice', description: 'Fiery red chicken fried rice seasoned with Szechuan pepper corn sauce.', price: 140, priceHalf: 100, isVeg: false, photoId: 'photo-1512058564366-18510be2db19' },
    { categoryId: catNonVegRice.id, name: 'Chicken Hongkong Rice', description: 'Dark soy flavored chicken fried rice with spring onions.', price: 140, priceHalf: 100, isVeg: false, photoId: 'photo-1596797038530-2c107229654b' },
    { categoryId: catNonVegRice.id, name: 'Chicken Singapore Rice', description: 'Curry spiced chicken fried rice with scrambled eggs.', price: 140, priceHalf: 100, isVeg: false, photoId: 'photo-1536304929831-ee1ca9d44906' },
    { categoryId: catNonVegRice.id, name: 'Chicken Triple Rice', description: 'Supreme combination of chicken fried rice, noodles, and gravy.', price: 150, priceHalf: 110, isVeg: false, photoId: 'photo-1516684732162-798a0062be99' },
    { categoryId: catNonVegRice.id, name: 'Chicken Garlic Rice', description: 'Garlic infused chicken fried rice with wok charred flavor.', price: 140, priceHalf: 100, isVeg: false, photoId: 'photo-1541544741938-0af808871cc0' },
    { categoryId: catNonVegRice.id, name: 'Chicken Fortune Rice', description: 'Chef fortune sauce fried rice loaded with chicken chunks.', price: 150, priceHalf: 110, isVeg: false, photoId: 'photo-1596797038530-2c107229654b' },
    { categoryId: catNonVegRice.id, name: 'Chicken Combination Rice', description: 'Chicken fried rice served with crunchy noodles on top.', price: 140, priceHalf: 100, isVeg: false, photoId: 'photo-1536304929831-ee1ca9d44906' },
    { categoryId: catNonVegRice.id, name: 'Mix Chicken Fried Rice', description: 'Special combination fried rice loaded with egg, chicken & chef spices.', price: 160, priceHalf: 120, isVeg: false, photoId: 'photo-1603133872878-684f208fb84b' },

    // INDIAN FOOD CURRY
    { categoryId: catIndianCurry.id, name: 'Chicken Korma', description: 'Rich Mughlai curry simmered in cream, yogurt, and aromatic spices.', price: 140, priceHalf: 90, isVeg: false, photoId: 'photo-1588166524941-3bf61a9c41db' },
    { categoryId: catIndianCurry.id, name: 'Chicken Masala', description: 'Traditional homestyle chicken curry cooked with onion tomato gravy.', price: 130, priceHalf: 80, isVeg: false, photoId: 'photo-1603894584373-5ac82b2ae398' },
    { categoryId: catIndianCurry.id, name: 'Chicken Curry', description: 'Classic spiced North Indian chicken curry with fresh coriander.', price: 130, priceHalf: 80, isVeg: false, photoId: 'photo-1626777552726-4a6b54c97e46' },
    { categoryId: catIndianCurry.id, name: 'Chicken Do Pyaza', description: 'Chicken gravy cooked with double onions and roasted cumin.', price: 140, priceHalf: 90, isVeg: false, photoId: 'photo-1546833999-b9f581a1996d' },
    { categoryId: catIndianCurry.id, name: 'Kadhai Chicken', description: 'Chicken cooked in wok with freshly ground kadhai masala and capsicum.', price: 140, priceHalf: 90, isVeg: false, photoId: 'photo-1603894584373-5ac82b2ae398' },
    { categoryId: catIndianCurry.id, name: 'Chicken Hindi', description: 'Desi style chicken curry cooked with authentic herbs.', price: 140, priceHalf: 90, isVeg: false, photoId: 'photo-1588166524941-3bf61a9c41db' },
    { categoryId: catIndianCurry.id, name: 'Chicken Casa', description: 'Semi-dry spicy chicken bhuna gravy with crushed black pepper.', price: 130, priceHalf: 80, isVeg: false, photoId: 'photo-1546833999-b9f581a1996d' },
    { categoryId: catIndianCurry.id, name: 'Tawa Chicken', description: 'Street style chicken cooked on flat iron tawa with green chilies.', price: 140, priceHalf: 90, isVeg: false, photoId: 'photo-1603894584373-5ac82b2ae398' },
    { categoryId: catIndianCurry.id, name: 'Chicken Keema', description: 'Minced chicken curry cooked with green peas and whole spices.', price: 140, priceHalf: 90, isVeg: false, photoId: 'photo-1588166524941-3bf61a9c41db' },
    { categoryId: catIndianCurry.id, name: 'Chicken Tangri Masala', description: 'Tandoori chicken drumsticks simmered in rich spicy tomato gravy.', price: 140, priceHalf: 80, isVeg: false, photoId: 'photo-1610057099443-fde8c4d50f91' },
    { categoryId: catIndianCurry.id, name: 'Chicken Butter Masala', description: 'Tender chicken pieces cooked in a creamy, velvety cashew butter gravy.', price: 150, priceHalf: 100, isVeg: false, photoId: 'photo-1588166524941-3bf61a9c41db' },
    { categoryId: catIndianCurry.id, name: 'Chicken Mughlai', description: 'Royal chicken gravy enriched with cashews, almonds and saffron.', price: 150, priceHalf: 100, isVeg: false, photoId: 'photo-1603894584373-5ac82b2ae398' },
    { categoryId: catIndianCurry.id, name: 'Chicken Kalapuri', description: 'Spicy Kolhapuri style chicken curry with roasted coconut spices.', price: 140, priceHalf: 90, isVeg: false, photoId: 'photo-1546833999-b9f581a1996d' },
    { categoryId: catIndianCurry.id, name: 'Chicken Chatpata', description: 'Tangy and spicy chicken curry finished with lemon juice and chaat masala.', price: 140, priceHalf: 90, isVeg: false, photoId: 'photo-1603894584373-5ac82b2ae398' },
    { categoryId: catIndianCurry.id, name: 'Chicken Tikka Masala', description: 'Charcoal charred chicken tikka pieces in a spicy onion gravy.', price: 150, priceHalf: 100, isVeg: false, photoId: 'photo-1588166524941-3bf61a9c41db' },
    { categoryId: catIndianCurry.id, name: 'Chicken Rogan Josh', description: 'Aromatic Kashmiri style chicken curry cooked with ratanjot spices.', price: 140, priceHalf: 90, isVeg: false, photoId: 'photo-1546833999-b9f581a1996d' },
    { categoryId: catIndianCurry.id, name: 'Egg Curry', description: 'Hard boiled eggs simmered in a spicy dhaba-style Indian gravy.', price: 70, priceHalf: 50, isVeg: false, photoId: 'photo-1626777552726-4a6b54c97e46' },
    { categoryId: catIndianCurry.id, name: 'Egg Masala', description: 'Boiled eggs cooked in a thick gravy of onions, ginger, and garlic.', price: 70, priceHalf: 50, isVeg: false, photoId: 'photo-1588166524941-3bf61a9c41db' },
    { categoryId: catIndianCurry.id, name: 'Omlet Curry', description: 'Fluffy fried egg omelet cut into pieces and simmered in spicy curry.', price: 80, priceHalf: 50, isVeg: false, photoId: 'photo-1546833999-b9f581a1996d' },
    { categoryId: catIndianCurry.id, name: 'Egg Boziya (2 Egg)', description: 'Desi style egg bhurji scrambled with tomatoes, onions and green chilies.', price: 40, priceHalf: 25, isVeg: false, photoId: 'photo-1626777552726-4a6b54c97e46' },

    // BIRYANI SPECIALS
    { categoryId: catBiryani.id, name: 'Veg Pulao', description: 'Aromatic basmati rice cooked with fresh green peas, carrots and spices.', price: 140, priceHalf: 100, isVeg: true, photoId: 'photo-1516684732162-798a0062be99' },
    { categoryId: catBiryani.id, name: 'Veg Biryani', description: 'Fragrant Dum biryani packed with fresh garden vegetables & saffron.', price: 110, priceHalf: 80, isVeg: true, photoId: 'photo-1563379091339-03b21ab4a4f8' },
    { categoryId: catBiryani.id, name: 'Paneer Biryani', description: 'Marinated cottage cheese layered with long grain basmati rice.', price: 130, priceHalf: 90, isVeg: true, photoId: 'photo-1633964913295-ceb43826e7c9' },
    { categoryId: catBiryani.id, name: 'Veg Dum Biryani', description: 'Slow cooked veg biryani sealed in handi with dum herbs.', price: 130, priceHalf: 90, isVeg: true, photoId: 'photo-1563379091339-03b21ab4a4f8' },
    { categoryId: catBiryani.id, name: 'Mushroom Biryani', description: 'Button mushrooms cooked with long grain basmati biryani rice.', price: 130, priceHalf: 90, isVeg: true, photoId: 'photo-1633964913295-ceb43826e7c9' },
    { categoryId: catBiryani.id, name: 'Veg Hyderabad Biryani', description: 'Spicy Hyderabadi style vegetable biryani served with fried onions.', price: 150, priceHalf: 100, isVeg: true, photoId: 'photo-1563379091339-03b21ab4a4f8' },
    { categoryId: catBiryani.id, name: 'Paneer Tikka Biryani', description: 'Charred paneer tikka pieces layered with fragrant Biryani rice.', price: 200, priceHalf: 120, isVeg: true, photoId: 'photo-1633964913295-ceb43826e7c9' },
    { categoryId: catBiryani.id, name: 'Steam Rice', description: 'Steamed fluffy long grain basmati white rice.', price: 60, priceHalf: 40, isVeg: true, photoId: 'photo-1516684732162-798a0062be99' },
    { categoryId: catBiryani.id, name: 'Jeera Rice', description: 'Basmati rice tempered with cumin seeds and desi ghee.', price: 90, priceHalf: 70, isVeg: true, photoId: 'photo-1596797038530-2c107229654b' },
    { categoryId: catBiryani.id, name: 'Biryani Rice', description: 'Plain aromatic saffron-infused biryani rice.', price: 90, priceHalf: 70, isVeg: true, photoId: 'photo-1563379091339-03b21ab4a4f8' },
    { categoryId: catBiryani.id, name: 'Chicken Biryani', description: 'Authentic dum biryani cooked with marinated tender chicken pieces.', price: 140, priceHalf: 90, isVeg: false, photoId: 'photo-1563379091339-03b21ab4a4f8' },
    { categoryId: catBiryani.id, name: 'Chicken Dum Biryani', description: 'Slow cooked Hyderabadi dum biryani sealed with spices and kewra water.', price: 180, priceHalf: 110, isVeg: false, photoId: 'photo-1633964913295-ceb43826e7c9' },
    { categoryId: catBiryani.id, name: 'Chicken Haiderabadi Biryani', description: 'Rich spicy Hyderabadi chicken biryani topped with caramelized onions.', price: 200, priceHalf: 130, isVeg: false, photoId: 'photo-1563379091339-03b21ab4a4f8' },
    { categoryId: catBiryani.id, name: 'Chicken Tikka Biryani', description: 'Smoky clay-oven chicken tikka layered with spiced Biryani rice.', price: 200, priceHalf: 130, isVeg: false, photoId: 'photo-1633964913295-ceb43826e7c9' },
    { categoryId: catBiryani.id, name: 'Egg Biryani', description: 'Hard boiled eggs layered with spicy biryani rice and mint.', price: 80, priceHalf: 50, isVeg: false, photoId: 'photo-1563379091339-03b21ab4a4f8' },
    { categoryId: catBiryani.id, name: 'Omlet Biryani', description: 'Unique biryani rice served with fluffy masala omelet.', price: 90, priceHalf: 60, isVeg: false, photoId: 'photo-1633964913295-ceb43826e7c9' },
    { categoryId: catBiryani.id, name: 'Chicken Fried Pices Biryani', description: 'Crispy fried chicken drumsticks served over biryani rice.', price: 150, priceHalf: 100, isVeg: false, photoId: 'photo-1563379091339-03b21ab4a4f8' },
    { categoryId: catBiryani.id, name: 'Mughlai Biryani', description: 'Royal Mughlai style chicken biryani with nuts, raisins and cream.', price: 150, priceHalf: 100, isVeg: false, photoId: 'photo-1633964913295-ceb43826e7c9' },

    // ROTI & KABAB
    { categoryId: catRotiKabab.id, name: 'Plain Roti', description: 'Traditional whole wheat tandoori flatbread.', price: 8, priceHalf: null, isVeg: true, photoId: 'photo-1626074353765-517a681e40be' },
    { categoryId: catRotiKabab.id, name: 'Butter Roti', description: 'Tandoori wheat roti brushed with fresh dairy butter.', price: 12, priceHalf: null, isVeg: true, photoId: 'photo-1565557623262-b51c2513a641' },
    { categoryId: catRotiKabab.id, name: 'Plain Paratha', description: 'Whole wheat flatbread cooked on griddle.', price: 15, priceHalf: null, isVeg: true, photoId: 'photo-1626074353765-517a681e40be' },
    { categoryId: catRotiKabab.id, name: 'Butter Paratha', description: 'Griddle baked wheat paratha brushed with butter.', price: 20, priceHalf: null, isVeg: true, photoId: 'photo-1565557623262-b51c2513a641' },
    { categoryId: catRotiKabab.id, name: 'Lacha Paratha', description: 'Multi-layered crispy flaky whole wheat paratha.', price: 25, priceHalf: null, isVeg: true, photoId: 'photo-1626074353765-517a681e40be' },
    { categoryId: catRotiKabab.id, name: 'Butter Lacha Paratha', description: 'Flaky layered paratha lavishly brushed with butter.', price: 35, priceHalf: null, isVeg: true, photoId: 'photo-1565557623262-b51c2513a641' },
    { categoryId: catRotiKabab.id, name: 'Plain Naan', description: 'Leavened soft white flour naan baked in clay tandoor.', price: 30, priceHalf: null, isVeg: true, photoId: 'photo-1601050690597-df0568f70950' },
    { categoryId: catRotiKabab.id, name: 'Butter Naan', description: 'Leavened soft naan baked in tandoor and brushed with butter.', price: 40, priceHalf: null, isVeg: true, photoId: 'photo-1565557623262-b51c2513a641' },
    { categoryId: catRotiKabab.id, name: 'Tandoori Roti', description: 'Clay tandoor baked crisp whole wheat roti.', price: 15, priceHalf: null, isVeg: true, photoId: 'photo-1626074353765-517a681e40be' },
    { categoryId: catRotiKabab.id, name: 'Butter Tandoori Roti', description: 'Tandoor baked wheat roti topped with melting butter.', price: 20, priceHalf: null, isVeg: true, photoId: 'photo-1565557623262-b51c2513a641' },
    { categoryId: catRotiKabab.id, name: 'Tandoori Aloo Paratha', description: 'Stuffed potato paratha baked in clay tandoor.', price: 40, priceHalf: null, isVeg: true, photoId: 'photo-1626074353765-517a681e40be' },
    { categoryId: catRotiKabab.id, name: 'Chicken Tandoori (Full)', description: 'Whole chicken marinated in yogurt & tandoori spices roasted over clay tandoor.', price: 600, priceHalf: 350, isVeg: false, photoId: 'photo-1610057099443-fde8c4d50f91' },
    { categoryId: catRotiKabab.id, name: 'Chicken Tikka Kabab', description: 'Succulent boneless chicken pieces charred on skewers with herbs.', price: 120, priceHalf: null, isVeg: false, photoId: 'photo-1599487488170-d11ec9c172f0' },
    { categoryId: catRotiKabab.id, name: 'Pahadi Kabab', description: 'Mint and coriander marinated green chicken kebabs.', price: 120, priceHalf: null, isVeg: false, photoId: 'photo-1544025162-d76694265947' },
    { categoryId: catRotiKabab.id, name: 'Chicken Kabab', description: 'Minced chicken seekh kebab grilled over glowing charcoal.', price: 120, priceHalf: null, isVeg: false, photoId: 'photo-1599487488170-d11ec9c172f0' },
    { categoryId: catRotiKabab.id, name: 'Chicken Kabab Leg Pc', description: 'Charred chicken leg piece marinated in kebab spices.', price: 120, priceHalf: null, isVeg: false, photoId: 'photo-1610057099443-fde8c4d50f91' },
    { categoryId: catRotiKabab.id, name: 'Tangari Leg 1Pc', description: 'Juicy tandoori chicken drumstick marinated in roasted spices.', price: 60, priceHalf: null, isVeg: false, photoId: 'photo-1598515214211-89d3c73ae83b' },
  ];

  for (const d of rawDishes) {
    const uniqueUrl = getUniqueImageUrl(d.name, d.photoId);
    await db.dish.create({
      data: {
        categoryId: d.categoryId,
        name: d.name,
        description: d.description,
        price: d.price,
        priceHalf: d.priceHalf,
        imageUrl: uniqueUrl,
        isVeg: d.isVeg,
        inStock: true,
        prepTimeMinutes: 12,
      },
    });
  }

  console.log(`✅ Successfully seeded ${rawDishes.length} items with exact Full & Half pricing!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
