-- Jalankan INI DULU di SQL Editor (query terpisah, klik Run)
-- Lalu jalankan file migration utama

SET default_transaction_read_only = off;

-- Cek status (harusnya: pg_is_in_recovery = false)
SELECT pg_is_in_recovery() AS database_readonly;
SHOW default_transaction_read_only;
