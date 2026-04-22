<template>
  <q-page class="q-pa-md bg-grey-1 flex flex-center">
    <div class="container-md text-center">
      <div v-if="!scannedStudent" class="q-mb-xl">
        <h1 class="text-h4 text-weight-bold text-grey-9 q-mb-md">Scan Student QR Code</h1>
        <p class="text-subtitle1 text-grey-6 q-mb-xl">Place the student ID card in front of the camera</p>
        
        <q-card flat bordered class="scanner-card rounded-borders overflow-hidden shadow-2">
            <div id="reader" style="width: 100%; min-height: 300px;"></div>
            <div v-if="scanning" class="q-pa-md bg-white border-top">
                <q-btn flat color="red" icon="stop" label="Stop Scanning" no-caps @click="stopScanner" />
            </div>
            <div v-else class="q-pa-lg bg-white">
                <div class="row q-col-gutter-sm justify-center">
                    <div class="col-auto">
                        <q-btn color="primary" icon="videocam" label="Start Camera" unelevated no-caps size="md" @click="startScanner" />
                    </div>
                    <div class="col-auto">
                        <q-file
                            v-model="qrFile"
                            label="Scan from File"
                            outlined
                            dense
                            accept="image/*"
                            class="qr-file-input"
                            @update:model-value="onFileChange"
                        >
                            <template v-slot:prepend>
                                <q-icon name="image" color="primary" />
                            </template>
                        </q-file>
                    </div>
                </div>
            </div>
        </q-card>
      </div>

      <!-- Scanned Student Result -->
      <transition
        appear
        enter-active-class="animated zoomIn"
        leave-active-class="animated zoomOut"
      >
        <q-card v-if="scannedStudent" flat bordered class="result-card rounded-borders shadow-10 overflow-hidden" style="width: 100%; max-width: 500px;">
            <q-card-section class="bg-primary text-white q-pa-lg text-center relative-position">
                <q-btn icon="close" flat round dense class="absolute-top-right q-ma-sm" color="white" @click="resetScanner" />
                <q-avatar size="90px" color="white" text-color="primary" class="shadow-5 q-mb-md">
                    {{ scannedStudent.name.charAt(0) }}
                </q-avatar>
                <div class="text-h5 text-weight-bold">{{ scannedStudent.name }}</div>
                <div class="text-caption text-blue-1">{{ scannedStudent.student_id }} | {{ scannedStudent.grade }}</div>
            </q-card-section>

            <q-card-section class="q-pa-lg">
                <div class="row q-col-gutter-md">
                    <!-- Status Chip -->
                    <div class="col-12 text-center q-mb-md">
                        <q-chip :color="scannedStudent.status === 'Active' ? 'green-1' : 'red-1'" :text-color="scannedStudent.status === 'Active' ? 'green-9' : 'red-9'" size="lg">
                            Status: {{ scannedStudent.status }}
                        </q-chip>
                    </div>

                    <!-- Attendance Section -->
                    <div class="col-12">
                        <q-card flat bordered class="q-pa-md bg-blue-50">
                            <div class="row items-center justify-between">
                                <div class="text-subtitle1 text-weight-bold text-primary">Attendance</div>
                                <div v-if="attendanceLoading"><q-spinner-dots color="primary" /></div>
                                <div v-else :class="todayAttendance ? 'text-green-7' : 'text-red-7'">
                                    {{ todayAttendance ? 'Marked' : 'Not Marked Today' }}
                                </div>
                            </div>
                            <q-btn 
                                v-if="!todayAttendance"
                                color="primary" 
                                icon="check_circle" 
                                label="Mark Present" 
                                unelevated 
                                no-caps 
                                class="full-width q-mt-sm"
                                :loading="markingAttendance"
                                @click="markAttendanceAuto"
                            />
                        </q-card>
                    </div>

                    <!-- Fees Section -->
                    <div class="col-12 q-mt-md">
                        <q-card flat bordered class="q-pa-md bg-green-50">
                            <div class="row items-center justify-between">
                                <div class="text-subtitle1 text-weight-bold text-green-9">Class Fees ({{ currentMonth }})</div>
                                <div v-if="feesLoading"><q-spinner-dots color="green-9" /></div>
                                <div v-else :class="isFeesPaid ? 'text-green-7' : 'text-red-7'">
                                    {{ isFeesPaid ? 'Paid' : 'Pending' }}
                                </div>
                            </div>
                            <div v-if="!isFeesPaid && !feesLoading" class="text-caption text-grey-7 q-mt-xs">
                                No payment record found for this month.
                            </div>
                            <q-btn 
                                v-if="!isFeesPaid && !feesLoading"
                                color="green-7" 
                                icon="bolt" 
                                label="Pay Now (One-Click)" 
                                unelevated 
                                no-caps 
                                class="full-width q-mt-sm"
                                :loading="markingFees"
                                @click="quickPay"
                            />
                            <q-btn 
                                v-if="!isFeesPaid && !feesLoading"
                                flat
                                color="grey-7" 
                                icon="open_in_new" 
                                label="Manual Entry" 
                                no-caps 
                                size="sm"
                                class="full-width q-mt-xs"
                                @click="goToFees"
                            />
                        </q-card>
                    </div>
                </div>
            </q-card-section>

            <q-card-actions align="center" class="q-pb-lg">
                <q-btn outline color="primary" label="Close" no-caps class="q-px-xl" @click="resetScanner" />
            </q-card-actions>
        </q-card>
      </transition>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { client } from 'src/api'
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'

const $q = useQuasar()
const router = useRouter()
const scanner = ref(null)
const scanning = ref(false)
const scannedStudent = ref(null)
const todayAttendance = ref(null)
const isFeesPaid = ref(false)
const qrFile = ref(null)
const html5QrCode = ref(null)

const attendanceLoading = ref(false)
const markingAttendance = ref(false)
const feesLoading = ref(false)
const markingFees = ref(false)

const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
const todayDate = new Date().toISOString().split('T')[0]

onMounted(() => {
})

onBeforeUnmount(() => {
    stopScanner()
})

const startScanner = () => {
    scanning.value = true
    setTimeout(() => {
        scanner.value = new Html5QrcodeScanner("reader", { 
            fps: 30,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const boxSize = Math.floor(minEdge * 0.8);
                return { width: boxSize, height: boxSize };
            },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 2,
            supportedScanTypes: [0],
            experimentalFeatures: { useBarCodeDetectorIfSupported: true },
            videoConstraints: {
                facingMode: { ideal: "environment" },
                focusMode: "continuous"
            }
        })
        scanner.value.render(onScanSuccess, onScanFailure)
    }, 100)
}

const stopScanner = async () => {
    if (scanner.value) {
        try {
            await scanner.value.clear()
        } catch (err) {
            console.error("Failed to clear scanner:", err)
        }
        scanner.value = null
    }
    scanning.value = false
}

const playBeep = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.02)
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15)
        oscillator.start(audioCtx.currentTime)
        oscillator.stop(audioCtx.currentTime + 0.15)
        if (navigator.vibrate) navigator.vibrate(100)
    } catch (e) {
        console.error('Feedback error:', e)
    }
}

const onScanSuccess = async (decodedText) => {
    if (!decodedText) return
    playBeep()
    await stopScanner()
    setTimeout(async () => {
        await handleScannedStudent(decodedText)
    }, 300)
}

const onScanFailure = () => {}

const onFileChange = async (file) => {
    if (!file) return;
    $q.loading.show({ message: 'Processing image...' });
    try {
        if (!html5QrCode.value) {
            html5QrCode.value = new Html5Qrcode("reader");
        }
        const decodedText = await html5QrCode.value.scanFile(file, true);
        $q.loading.hide();
        if (decodedText) {
            playBeep();
            handleScannedStudent(decodedText);
        }
    } catch {
        $q.loading.hide();
        $q.notify({
            type: 'negative',
            message: 'QR code not found in the image.',
            position: 'top'
        });
    } finally {
        qrFile.value = null;
    }
}

const handleScannedStudent = async (studentId) => {
    $q.loading.show({ message: 'Fetching student details...' })
    try {
        const student = await client.get(`students/by-id/${studentId}`)
        if (!student) {
            $q.notify({ type: 'negative', message: 'Student not found: ' + studentId })
            startScanner()
            return
        }
        scannedStudent.value = student
        fetchAttendance(student.id)
        fetchFees(student.id)
    } catch {
        $q.notify({ type: 'negative', message: 'Error fetching student details' })
        startScanner()
    } finally {
        $q.loading.hide()
    }
}

const fetchAttendance = async (studentDbId) => {
    attendanceLoading.value = true
    try {
        const data = await client.get(`attendance?student_id=${studentDbId}&date=${todayDate}`)
        todayAttendance.value = data && data.length > 0 ? data[0] : null
    } catch {
        // Ignore
    } finally {
        attendanceLoading.value = false
    }
}

const fetchFees = async (studentDbId) => {
    feesLoading.value = true
    try {
        const data = await client.get(`payments?student_id=${studentDbId}&month=${currentMonth}`)
        isFeesPaid.value = data && data.length > 0
    } catch {
        // Ignore
    } finally {
        feesLoading.value = false
    }
}

const markAttendanceAuto = async () => {
    if (!scannedStudent.value) return
    markingAttendance.value = true
    try {
        const classes = await client.get(`classes?grade=${scannedStudent.value.grade}&status=Active`)
        if (!classes || classes.length === 0) {
            $q.notify({ type: 'warning', message: `No active class found for ${scannedStudent.value.grade}` })
            return
        }

        await client.post('attendance/upsert', {
            records: [{
                student_id: scannedStudent.value.id,
                class_id: classes[0].id,
                date: todayDate,
                status: 'Present'
            }]
        })

        $q.notify({ type: 'positive', message: 'Attendance marked: Present', icon: 'check' })
        fetchAttendance(scannedStudent.value.id)
        sendAttendanceWA(scannedStudent.value)
    } catch {
        $q.notify({ type: 'negative', message: 'Failed to mark attendance' })
    } finally {
        markingAttendance.value = false
    }
}

const sendAttendanceWA = (student) => {
    if (!student.contact) return

    let phone = student.contact
    // Format for Sri Lanka (94) if it starts with 0
    if (phone.startsWith('0')) phone = '94' + phone.substring(1)
    // Clean all non-numeric characters
    phone = phone.replace(/\D/g, '')

    const message = `Halo ${student.name}, අද පන්තියට පැමිණි බව අපි සටහන් කර ගත්තා. ස්තූතියි!`
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    
    // Attempt to open WhatsApp
    const win = window.open(url, '_blank')
    
    // Fallback if blocked by browser
    if (!win || win.closed || typeof win.closed === 'undefined') {
        $q.notify({
            message: 'WhatsApp blocked! Click below to send.',
            type: 'warning',
            position: 'top',
            timeout: 10000,
            actions: [
                { label: 'Send Message', color: 'white', handler: () => window.open(url, '_blank') }
            ]
        })
    }
}

const quickPay = async () => {
    if (!scannedStudent.value) return
    markingFees.value = true
    try {
        // Find classes for this student's grade
        const classes = await client.get(`classes?grade=${scannedStudent.value.grade}&status=Active`)
        if (!classes || classes.length === 0) {
            $q.notify({ type: 'warning', message: 'No active class found to pay for.' })
            return
        }

        const receiptNo = `QR-${Date.now().toString().slice(-6)}`
        await client.post('payments', {
            student_id: scannedStudent.value.id,
            class_id: classes[0].id,
            amount: classes[0].fee,
            month: currentMonth,
            payment_method: 'Cash',
            receipt_no: receiptNo
        })

        $q.notify({ 
            type: 'positive', 
            message: 'Payment Recorded!', 
            caption: `Rs. ${classes[0].fee} for ${currentMonth}`,
            icon: 'check_circle' 
        })
        isFeesPaid.value = true
    } catch (e) {
        $q.notify({ type: 'negative', message: 'Payment failed: ' + (e.response?.data?.error || e.message) })
    } finally {
        markingFees.value = false
    }
}

const goToFees = () => {
    if (!scannedStudent.value) return
    router.push({
        path: '/dashboard/fees',
        query: { student_id: scannedStudent.value.id }
    })
}

const resetScanner = () => {
    scannedStudent.value = null
    todayAttendance.value = null
    isFeesPaid.value = false
    startScanner()
}
</script>

<style scoped lang="scss">
.scanner-card {
    background: white;
    border-radius: 20px;
    width: 400px;
    max-width: 95vw;
}

.result-card {
    border-radius: 24px;
}

#reader {
    border: none !important;
    overflow: hidden;
    border-radius: 12px;
}

#reader__scan_region {
    background: #f8f9fa;
}

#reader__dashboard_section_csr button {
    background: #1976D2 !important;
    color: white !important;
    border: none !important;
    padding: 8px 16px !important;
    border-radius: 8px !important;
    text-transform: uppercase !important;
    font-weight: bold !important;
}

.bg-blue-50 {
    background-color: #f0f7ff;
}

.bg-green-50 {
    background-color: #f0fff4;
}

.qr-file-input {
    width: 180px;
}
</style>
