const BASE_URL = 'http://192.168.43.42:3000';
let pollingInterval;
let sessionEnded = false;

function startMonitoring() {
  document.getElementById('status').innerText = '⏳ Menunggu kartu RFID...';
  document.getElementById('card-status').innerText = '';
  document.getElementById('results').style.display = 'none';
  sessionEnded = false;

  let attempt = 0;
  pollingInterval = setInterval(async () => {
    try {
      const res = await fetch(BASE_URL + '/scan/card');
      attempt++;

      if (res.ok) {
        const data = await res.json();
        clearInterval(pollingInterval);
        localStorage.setItem('activeCardId', data.cardId);

        const checkRes = await fetch(BASE_URL + '/sessions/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: data.cardId })
        });

        const checkData = await checkRes.json();

        if (checkData.userExists) {
          document.getElementById('card-status').innerText = '✅ Kartu terbaca! Silakan mulai olahraga.';
          document.getElementById('status').innerText = '🚴 Monitoring sesi...';
          setTimeout(() => startEndPolling(), 1500);
        } else {
          window.location.href = `/signup.html`;
        }
      }

      if (attempt > 15) {
        clearInterval(pollingInterval);
        document.getElementById('status').innerText = '⛔ Tidak ada kartu terdeteksi.';
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 2000);
}

function startEndPolling() {
  pollingInterval = setInterval(async () => {
    try {
      const res = await fetch(BASE_URL + '/sessions/active-latest');
      if (res.status === 404 && !sessionEnded) {
        sessionEnded = true;
        clearInterval(pollingInterval);

        const cardId = localStorage.getItem('activeCardId');
        document.getElementById('card-status').innerText = '✅ Sesi berakhir.';
        document.getElementById('status').innerText = '⏳ Mengambil hasil latihan...';

        setTimeout(() => fetchFinalSession(cardId), 1500);
      }
    } catch (err) {
      console.error('Polling error on end:', err);
    }
  }, 2000);
}

async function fetchFinalSession(cardId) {
  try {
    const res = await fetch(BASE_URL + '/sessions/' + cardId);
    const data = await res.json();

    if (data.sessions && data.sessions.length > 0) {
      const session = data.sessions[0];
      document.getElementById('status').innerText = '✅ Sesi selesai.';
      document.getElementById('distance').innerText = session.distance?.toFixed(2) ?? '0';
      document.getElementById('calories').innerText = session.calories?.toFixed(2) ?? '0';
      document.getElementById('results').style.display = 'block';
    } else {
      alert('❌ Sesi tidak ditemukan.');
    }
  } catch (err) {
    console.error('❌ Gagal ambil sesi:', err);
    alert('Gagal mengambil data sesi.');
  }
}

function promptUpdateWeight() {
  const cardId = localStorage.getItem('activeCardId');
  if (!cardId) {
    alert("Scan kartu dulu sebelum update berat.");
    return;
  }

  const newWeight = prompt("Masukkan berat badan terbaru (kg):");
  if (newWeight && !isNaN(newWeight)) {
    fetch(`${BASE_URL}/users/${cardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight: Number(newWeight) })
    }).then(async res => {
      const data = await res.json();
      if (res.ok) {
        alert('✅ Berat badan berhasil diperbarui!');
      } else {
        alert('❌ Gagal update: ' + data.message);
      }
    }).catch(err => {
      console.error(err);
      alert('Terjadi kesalahan saat mengupdate.');
    });
  } else {
    alert("Input tidak valid.");
  }
}
