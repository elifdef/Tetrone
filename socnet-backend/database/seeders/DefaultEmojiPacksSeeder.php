<?php
//
//namespace Database\Seeders;
//
//use App\Models\StickerPack;
//use Illuminate\Database\Seeder;
//use Illuminate\Support\Facades\File;
//use Illuminate\Support\Facades\Storage;
//
//class DefaultEmojiPacksSeeder extends Seeder
//{
//    public function run(): void
//    {
//        // 1. Створюємо запис паку в БД
//        $pack = StickerPack::create([
//            'author_id' => 1,
//            'title' => 'Q84 pack',
//            'short_name' => 'q84_pack',
//            'is_published' => true,
//        ]);
//
//        // 2. Шлях до оригіналів у папці seeders
//        $sourcePath = database_path('seeders/assets/stickers');
//
//        // 3. Перевіряємо, чи є там файли
//        if (File::exists($sourcePath)) {
//            $files = File::files($sourcePath);
//
//            foreach ($files as $index => $file) {
//                $filename = $file->getFilename();
//                $shortcode = $file->getFilenameWithoutExtension();
//
//                // Шлях, куди ми їх копіюємо (для публічного доступу)
//                $destinationPath = 'emojis/default_pack/' . $filename;
//
//                // Копіюємо фізичний файл
//                Storage::disk('public')->put($destinationPath, File::get($file));
//
//                // Створюємо запис стікера в БД
//                $pack->emojis()->create([
//                    'file_path' => $destinationPath,
//                    'shortcode' => $shortcode,
//                    'keywords' => $shortcode,
//                    'sort_order' => $index
//                ]);
//            }
//        }
//    }
//}