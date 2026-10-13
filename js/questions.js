/*
 * BANK SOAL
 * ---------------------------------------------------------------
 * Silakan tambah / ubah soal sesuai kebutuhan kelas.
 * Format tiap soal:
 *   { q: "Teks soal", options: ["Pilihan 1", "Pilihan 2", ...], answer: <index pilihan benar, mulai 0> }
 * Jumlah pilihan boleh 2–6; jumlah bola jawaban mengikuti jumlah pilihan.
 * Urutan soal dan pilihan diacak otomatis saat kuis dimulai.
 */
window.QUESTION_BANK = {
  IPA: {
    name: "IPA",
    icon: "🔬",
    color: "#10b981",
    questions: [
      { q: "Organel sel yang menjadi tempat respirasi sel adalah…", options: ["Mitokondria", "Ribosom", "Lisosom", "Vakuola"], answer: 0 },
      { q: "Satuan internasional (SI) untuk gaya adalah…", options: ["Newton", "Joule", "Watt", "Pascal"], answer: 0 },
      { q: "Proses tumbuhan membuat makanan dengan bantuan cahaya matahari disebut…", options: ["Fotosintesis", "Respirasi", "Transpirasi", "Evaporasi"], answer: 0 },
      { q: "Planet terbesar di tata surya kita adalah…", options: ["Jupiter", "Saturnus", "Bumi", "Neptunus"], answer: 0 },
      { q: "Perubahan wujud dari padat langsung menjadi gas disebut…", options: ["Menyublim", "Mencair", "Membeku", "Mengembun"], answer: 0 },
      { q: "Rumus kimia air adalah…", options: ["H₂O", "CO₂", "O₂", "NaCl"], answer: 0 },
      { q: "Alat untuk mengukur suhu adalah…", options: ["Termometer", "Barometer", "Higrometer", "Speedometer"], answer: 0 },
      { q: "Organ yang memompa darah ke seluruh tubuh adalah…", options: ["Jantung", "Paru-paru", "Hati", "Ginjal"], answer: 0 },
      { q: "Hewan yang mengalami metamorfosis sempurna adalah…", options: ["Kupu-kupu", "Belalang", "Kecoak", "Capung"], answer: 0 },
      { q: "Penderita rabun dekat (hipermetropi) dibantu dengan lensa…", options: ["Cembung", "Cekung", "Silinder", "Datar"], answer: 0 }
    ]
  },

  IPS: {
    name: "IPS",
    icon: "🌏",
    color: "#f59e0b",
    questions: [
      { q: "Proklamasi kemerdekaan Indonesia dibacakan pada tanggal…", options: ["17 Agustus 1945", "20 Mei 1908", "28 Oktober 1928", "1 Juni 1945"], answer: 0 },
      { q: "Kegiatan menghasilkan barang atau jasa disebut…", options: ["Produksi", "Distribusi", "Konsumsi", "Investasi"], answer: 0 },
      { q: "Ibu kota Provinsi Jawa Timur adalah…", options: ["Surabaya", "Malang", "Semarang", "Bandung"], answer: 0 },
      { q: "Organisasi kerja sama negara-negara Asia Tenggara adalah…", options: ["ASEAN", "PBB", "NATO", "OPEC"], answer: 0 },
      { q: "Garis khayal yang membagi bumi menjadi belahan utara dan selatan adalah…", options: ["Khatulistiwa", "Garis bujur", "Meridian Greenwich", "Garis balik utara"], answer: 0 },
      { q: "Sumpah Pemuda diikrarkan pada tahun…", options: ["1928", "1908", "1945", "1918"], answer: 0 },
      { q: "Kerajaan Hindu tertua di Indonesia adalah…", options: ["Kutai", "Majapahit", "Sriwijaya", "Mataram Kuno"], answer: 0 },
      { q: "Mata uang negara Jepang adalah…", options: ["Yen", "Won", "Yuan", "Ringgit"], answer: 0 },
      { q: "Alat untuk menunjukkan arah mata angin adalah…", options: ["Kompas", "Globe", "Barometer", "Teleskop"], answer: 0 },
      { q: "Bank sentral yang menjaga kestabilan nilai rupiah adalah…", options: ["Bank Indonesia", "Bank swasta", "Koperasi", "Pegadaian"], answer: 0 }
    ]
  },

  Informatika: {
    name: "Informatika",
    icon: "💻",
    color: "#6366f1",
    questions: [
      { q: "Perangkat keras yang berfungsi sebagai otak komputer adalah…", options: ["CPU", "Monitor", "Keyboard", "Printer"], answer: 0 },
      { q: "Contoh perangkat input adalah…", options: ["Mouse", "Monitor", "Speaker", "Printer"], answer: 0 },
      { q: "Bilangan biner dari angka desimal 5 adalah…", options: ["101", "110", "111", "100"], answer: 0 },
      { q: "Langkah-langkah logis dan sistematis untuk menyelesaikan masalah disebut…", options: ["Algoritma", "Program", "Data", "Hardware"], answer: 0 },
      { q: "Kepanjangan dari WWW adalah…", options: ["World Wide Web", "World Web Wide", "Wide World Web", "Web World Wide"], answer: 0 },
      { q: "Aplikasi pengolah angka (lembar kerja) adalah…", options: ["Microsoft Excel", "Microsoft Word", "PowerPoint", "Paint"], answer: 0 },
      { q: "Simbol flowchart berbentuk belah ketupat berarti…", options: ["Keputusan", "Proses", "Mulai / Selesai", "Input / Output"], answer: 0 },
      { q: "Program jahat yang dapat merusak komputer disebut…", options: ["Malware", "Antivirus", "Browser", "Firewall"], answer: 0 },
      { q: "1 byte sama dengan…", options: ["8 bit", "4 bit", "16 bit", "1024 bit"], answer: 0 },
      { q: "Kata sandi (password) akun sebaiknya…", options: ["Dirahasiakan", "Dibagikan ke teman", "Ditulis di media sosial", "Sama dengan nama sendiri"], answer: 0 }
    ]
  },

  Matematika: {
    name: "Matematika",
    icon: "➗",
    color: "#ef4444",
    questions: [
      { q: "Hasil dari 12 × 8 adalah…", options: ["96", "86", "98", "108"], answer: 0 },
      { q: "Hasil dari 144 : 12 adalah…", options: ["12", "14", "11", "13"], answer: 0 },
      { q: "Nilai dari √81 adalah…", options: ["9", "8", "7", "18"], answer: 0 },
      { q: "Keliling persegi dengan panjang sisi 7 cm adalah…", options: ["28 cm", "49 cm", "14 cm", "21 cm"], answer: 0 },
      { q: "Luas segitiga dengan alas 10 cm dan tinggi 6 cm adalah…", options: ["30 cm²", "60 cm²", "16 cm²", "36 cm²"], answer: 0 },
      { q: "Hasil dari −5 + 8 adalah…", options: ["3", "−3", "13", "−13"], answer: 0 },
      { q: "25% dari 200 adalah…", options: ["50", "25", "75", "100"], answer: 0 },
      { q: "Jika 2x + 3 = 11, maka nilai x adalah…", options: ["4", "7", "5", "3"], answer: 0 },
      { q: "Banyak sisi pada segi enam adalah…", options: ["6", "5", "8", "4"], answer: 0 },
      { q: "Hasil dari 3² + 4² adalah…", options: ["25", "49", "14", "12"], answer: 0 }
    ]
  },

  Agama: {
    name: "Agama",
    icon: "🕌",
    color: "#14b8a6",
    questions: [
      { q: "Kitab suci umat Islam adalah…", options: ["Al-Qur'an", "Injil", "Taurat", "Zabur"], answer: 0 },
      { q: "Jumlah rukun Islam ada…", options: ["5", "6", "4", "7"], answer: 0 },
      { q: "Salat wajib dalam sehari semalam berjumlah…", options: ["5 waktu", "3 waktu", "4 waktu", "6 waktu"], answer: 0 },
      { q: "Rukun iman yang pertama adalah iman kepada…", options: ["Allah", "Malaikat", "Kitab", "Rasul"], answer: 0 },
      { q: "Malaikat yang bertugas menyampaikan wahyu adalah…", options: ["Jibril", "Mikail", "Israfil", "Izrail"], answer: 0 },
      { q: "Nabi dan rasul terakhir adalah…", options: ["Nabi Muhammad saw.", "Nabi Isa as.", "Nabi Musa as.", "Nabi Ibrahim as."], answer: 0 },
      { q: "Puasa wajib dilaksanakan pada bulan…", options: ["Ramadan", "Syawal", "Rajab", "Muharam"], answer: 0 },
      { q: "Sifat wajib rasul yang berarti jujur adalah…", options: ["Sidiq", "Amanah", "Tablig", "Fatanah"], answer: 0 },
      { q: "Surah pertama dalam Al-Qur'an adalah…", options: ["Al-Fatihah", "Al-Baqarah", "An-Nas", "Al-Ikhlas"], answer: 0 },
      { q: "Zakat yang wajib dikeluarkan menjelang Idulfitri adalah…", options: ["Zakat fitrah", "Zakat mal", "Infak", "Sedekah"], answer: 0 }
    ]
  },

  PPKN: {
    name: "PPKn",
    icon: "🦅",
    color: "#e11d48",
    questions: [
      { q: "Dasar negara Indonesia adalah…", options: ["Pancasila", "UUD 1945", "Bhinneka Tunggal Ika", "Sumpah Pemuda"], answer: 0 },
      { q: "Lambang sila pertama Pancasila adalah…", options: ["Bintang", "Rantai", "Pohon beringin", "Kepala banteng"], answer: 0 },
      { q: "Semboyan Bhinneka Tunggal Ika artinya…", options: ["Berbeda-beda tetapi tetap satu", "Bersatu kita teguh", "Satu nusa satu bangsa", "Merdeka atau mati"], answer: 0 },
      { q: "Lambang sila ketiga Pancasila adalah…", options: ["Pohon beringin", "Padi dan kapas", "Bintang", "Rantai"], answer: 0 },
      { q: "Hari Lahir Pancasila diperingati setiap tanggal…", options: ["1 Juni", "17 Agustus", "1 Oktober", "28 Oktober"], answer: 0 },
      { q: "Lagu kebangsaan Indonesia adalah…", options: ["Indonesia Raya", "Garuda Pancasila", "Halo-Halo Bandung", "Tanah Airku"], answer: 0 },
      { q: "Lembaga yang membentuk undang-undang bersama presiden adalah…", options: ["DPR", "MA", "BPK", "KY"], answer: 0 },
      { q: "Toleransi antarumat beragama mencerminkan sila ke…", options: ["Pertama", "Kedua", "Ketiga", "Kelima"], answer: 0 },
      { q: "Musyawarah untuk mencapai mufakat mencerminkan sila ke…", options: ["Keempat", "Kedua", "Ketiga", "Kelima"], answer: 0 },
      { q: "Lambang negara Indonesia adalah…", options: ["Garuda Pancasila", "Bendera Merah Putih", "Monas", "Elang Jawa"], answer: 0 }
    ]
  }
};
