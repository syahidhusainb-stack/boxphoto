let stream = null;

const video = document.getElementById("video");
const statusText = document.getElementById("status");
const countdown = document.getElementById("countdown");
const flash = document.getElementById("flash");

let photos = [];

const canvas = document.createElement("canvas");


// ================================
// DATE
// ================================

const today = new Date();

document.getElementById("date").value =
    today.toISOString().split("T")[0];


// ================================
// START CAMERA
// ================================

document
    .getElementById("startCamera")
    .addEventListener("click", startCamera);


async function startCamera() {

    try {

        statusText.innerText =
            "⏳ Membuka kamera...";


        // Cek browser support

        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia) {

            statusText.innerText =
                "❌ Browser ini tidak mendukung kamera.";

            return;
        }


        // Stop kamera lama

        if (stream) {

            stream.getTracks().forEach(
                track => track.stop()
            );

        }


        // Minta akses kamera

        stream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: "user",
                    width: {
                        ideal: 1280
                    },
                    height: {
                        ideal: 720
                    }
                },

                audio: false

            });


        // Masukkan stream ke video

        video.srcObject = stream;


        await video.play();


        statusText.innerText =
            "📷 Kamera berhasil dinyalakan!";


    } catch (error) {

        console.error(
            "Camera Error:",
            error
        );


        if (
            error.name ===
            "NotAllowedError"
        ) {

            statusText.innerText =
                "❌ Izin kamera ditolak. Izinkan kamera di browser.";

        }

        else if (
            error.name ===
            "NotFoundError"
        ) {

            statusText.innerText =
                "❌ Kamera tidak ditemukan.";

        }

        else if (
            error.name ===
            "NotReadableError"
        ) {

            statusText.innerText =
                "❌ Kamera sedang digunakan aplikasi lain.";

        }

        else {

            statusText.innerText =
                "❌ Kamera gagal dibuka: " +
                error.name;

        }

    }

}


// ================================
// COUNTDOWN
// ================================

function runCountdown() {

    return new Promise(resolve => {

        let number = 3;


        countdown.style.display =
            "flex";


        countdown
            .querySelector("span")
            .innerText = number;


        const timer =
            setInterval(() => {

                number--;


                if (number <= 0) {

                    clearInterval(timer);

                    countdown.style.display =
                        "none";

                    resolve();

                }

                else {

                    countdown
                        .querySelector("span")
                        .innerText =
                        number;

                }

            }, 1000);

    });

}


// ================================
// FILTER
// ================================

function getFilter() {

    const filter =
        document.getElementById(
            "filter"
        ).value;


    switch (filter) {

        case "soft":
            return "brightness(1.1) saturate(1.15)";

        case "vintage":
            return "sepia(.65) contrast(1.05)";

        case "bw":
            return "grayscale(1)";

        case "vivid":
            return "contrast(1.15) saturate(1.4)";

        default:
            return "none";

    }

}


// ================================
// TAKE PHOTO
// ================================

function takePhoto() {

    canvas.width =
        video.videoWidth;

    canvas.height =
        video.videoHeight;


    const ctx =
        canvas.getContext("2d");


    ctx.save();


    // Mirror kamera depan

    ctx.translate(
        canvas.width,
        0
    );

    ctx.scale(
        -1,
        1
    );


    ctx.filter =
        getFilter();


    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.restore();


    // Flash

    flash.classList.remove(
        "flash-active"
    );

    void flash.offsetWidth;

    flash.classList.add(
        "flash-active"
    );


    return canvas.toDataURL(
        "image/jpeg",
        0.92
    );

}


// ================================
// START PHOTOBOX
// ================================

document
    .getElementById("startPhotobox")
    .addEventListener(
        "click",
        startPhotobox
    );


async function startPhotobox() {

    // Kamera belum aktif

    if (!stream) {

        await startCamera();

        if (!stream) {
            return;
        }

    }


    const layout =
        document.getElementById(
            "layout"
        ).value;


    const [columns, rows] =
        layout
            .split("x")
            .map(Number);


    const total =
        columns * rows;


    photos = [];


    document
        .getElementById("result")
        .style.display =
        "none";


    statusText.innerText =
        `📸 Siap mengambil ${total} foto...`;


    await sleep(1000);


    for (
        let i = 0;
        i < total;
        i++
    ) {

        statusText.innerText =
            `📸 Foto ${i + 1} dari ${total}`;


        await runCountdown();


        photos.push(
            takePhoto()
        );


        await sleep(500);

    }


    createResult();

}


// ================================
// RESULT
// ================================

function createResult() {

    const layout =
        document.getElementById(
            "layout"
        ).value;


    const [columns, rows] =
        layout
            .split("x")
            .map(Number);


    const grid =
        document.getElementById(
            "photoGrid"
        );


    grid.style.gridTemplateColumns =
        `repeat(${columns}, 1fr)`;


    grid.style.gridTemplateRows =
        `repeat(${rows}, 1fr)`;


    grid.innerHTML = "";


    photos.forEach(photo => {

        const img =
            document.createElement(
                "img"
            );


        img.src = photo;


        grid.appendChild(img);

    });


    // NAMA

    const name1 =
        document.getElementById(
            "name1"
        ).value.trim();


    const name2 =
        document.getElementById(
            "name2"
        ).value.trim();


    let names =
        "Our Little Moments";


    if (name1 && name2) {

        names =
            `${name1} × ${name2}`;

    }

    else if (name1) {

        names = name1;

    }

    else if (name2) {

        names = name2;

    }


    document
        .getElementById(
            "resultNames"
        ).innerText =
        names;


    // TITLE

    document
        .getElementById(
            "resultTitle"
        ).innerText =

        document
            .getElementById(
                "title"
            ).value ||

        "Our Little Moments";


    // MESSAGE

    document
        .getElementById(
            "resultMessage"
        ).innerText =

        document
            .getElementById(
                "message"
            ).value ||

        "A little moment with you ❤️";


    // DATE

    const dateValue =
        document
            .getElementById(
                "date"
            ).value;


    if (dateValue) {

        const date =
            new Date(
                dateValue +
                "T00:00:00"
            );


        document
            .getElementById(
                "resultDate"
            ).innerText =

            date.toLocaleDateString(
                "id-ID",
                {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            );

    }


    // FRAME

    const frame =
        document.getElementById(
            "photoFrame"
        );


    frame.className =
        "photo-frame " +

        document.getElementById(
            "frame"
        ).value;


    // SHOW

    document
        .getElementById(
            "result"
        ).style.display =
        "block";


    statusText.innerText =
        "🎉 Photobox selesai! ❤️";


    setTimeout(() => {

        document
            .getElementById(
                "result"
            )
            .scrollIntoView({
                behavior: "smooth"
            });

    }, 300);

}


// ================================
// RESET
// ================================

document
    .getElementById("reset")
    .addEventListener(
        "click",
        reset
    );


function reset() {

    photos = [];


    document
        .getElementById("result")
        .style.display =
        "none";


    statusText.innerText =
        "Siap bikin kenangan lagi 💗";

}


// ================================
// RETAKE
// ================================

document
    .getElementById("retake")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "result"
                ).style.display =
                "none";


            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }
    );


// ================================
// UTILITY
// ================================

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}