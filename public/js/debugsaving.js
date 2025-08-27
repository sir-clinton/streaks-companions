const displayMode = document.getElementById('display-mode');
const editMode = document.getElementById('edit-mode');
const saveBtn = document.querySelector('.save-btn');


saveBtn.addEventListener('click', async(event) => {
     const updatedData = {
        name: document.getElementById('name-input').value,
        city: document.getElementById('city-input').value,
        location: document.getElementById('location-input').value,
        about: document.getElementById('about-input').value,
        phone: document.getElementById('phone-input').value,
        instagram: document.getElementById('instagram-input').value,
        facebook: document.getElementById('facebook-input').value,
        twitter: document.getElementById('twitter-input').value,
        tiktok: document.getElementById('tiktok-input').value
        };
   

    displayMode.classList.remove('hide');
    editMode.classList.add('hide');
    document.querySelector('.display-mode').style.display = 'flex';
    document.querySelector('.edit-mode').style.display = 'none';
    document.getElementById('name-display').textContent = updatedData.name;
    document.getElementById('city-display').innerHTML = updatedData.city;
    document.getElementById('about-display').textContent = updatedData.about || 'No description provided.';
    document.getElementById('phone-display').innerHTML =updatedData.phone || 'Not provided';
    document.getElementById('instagram-input').value = updatedData.instagram || '';
    document.getElementById('facebook-input').value = updatedData.facebook || '';
    document.getElementById('twitter-input').value = updatedData.twitter || '';
    document.getElementById('tiktok-input').value = updatedData.tiktok || '';
    document.getElementById('snapchat-input').value = updatedData.snapchat || '';

    if (updatedData.instagram) {
        document.querySelector('#instagram').innerHTML = `<a href="${updatedData.instagram}" target="_blank"><i class="fab fa-instagram"></i></a>`;
    }

    if (updatedData.facebook) {
        document.querySelector('#facebook').innerHTML = `<a href="${updatedData.facebook}" target="_blank"><i class="fab fa-facebook-f"></i></a>`;
    }

    if (updatedData.twitter) {
        document.querySelector('#twitter').innerHTML = `<a href="${updatedData.twitter}" target="_blank"><i class="fab fa-twitter"></i></a>`;
    }

    if (updatedData.tiktok) {
        document.querySelector('#tiktok').innerHTML = `<a href="${updatedData.tiktok}" target="_blank"><i class="fab fa-tiktok"></i></a>`;
    }


   
   
    try {
    const res = await fetch('/profile/edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });

    const result = await res.json();
    console.log(result)
    const badgeContainer = document.getElementById('profile-status');

    if (result.missingFields.length === 0) {
        badgeContainer.innerHTML = `
            <span class="badge success-badge tooltip">
                <i class="fas fa-check-circle"></i>
                <span class="tooltiptext">Profile is complete</span>
            </span>
        `;
    } else {
        badgeContainer.innerHTML = `
        <span class="badge alert-badge tooltip">
            <i class="fas fa-exclamation-circle"></i>   
            <span class="tooltiptext">Incomplete Profile (${result.missingFields.length})</span>
        </span>`;
    }

    // ✅ Live Update the UI
    
    // ✅ Add success feedback
    showToast('Profile updated successfully!');
    // document.querySelector('.edit-buttons').style.display = 'flex';
    
  } catch (err) {
        console.error('Update failed:', err.message);
        showToast('Update failed. Try again.');
  }
});
