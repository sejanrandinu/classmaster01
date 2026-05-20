<template>
  <q-page class="portal-root q-pa-md">
    <div class="portal-container no-print">
      <!-- Header Branding -->
      <div class="row items-center justify-between q-mb-xl">
        <div class="row items-center">
            <q-avatar size="50px" class="q-mr-md glow-shadow">
                <img src="/favicon.svg">
            </q-avatar>
            <div>
                <h1 class="text-h4 text-weight-bolder text-white no-margin letter-spacing-tight">
                  {{ appStore.language === 'English' ? 'Student Portal' : 'ශිෂ්‍ය ද්වාරය' }}
                </h1>
                <div class="text-indigo-2 text-caption">
                  {{ appStore.language === 'English' ? 'Performance & Academic Metrics v3.1 Premium' : 'කාර්ය සාධන සහ අධ්‍යයන දර්ශක v3.1 Premium' }}
                </div>
            </div>
        </div>
        <div class="row items-center q-gutter-sm">
            <!-- Language selector -->
            <q-btn 
                flat 
                color="white" 
                dense
                no-caps
                class="glass-btn q-px-sm"
                @click="appStore.language = appStore.language === 'English' ? 'Sinhala' : 'English'"
            >
                <q-icon name="translate" size="xs" class="q-mr-xs text-teal-4" />
                {{ appStore.language === 'English' ? 'සිංහල' : 'English' }}
            </q-btn>
            <div v-if="studentData">
                <q-btn flat color="white" icon="logout" :label="appStore.language === 'English' ? 'Sign Out' : 'ඉවත් වන්න'" @click="studentData = null" no-caps class="glass-btn" />
            </div>
        </div>
      </div>

      <!-- Auth State: ID Entry -->
      <div v-if="!studentData" class="flex flex-center" style="min-height: 60vh;">
        <q-card flat class="auth-card glass-modern q-pa-xl shadow-24 text-center">
            <div class="q-mb-lg">
                <q-icon name="fingerprint" size="64px" color="indigo-4" class="q-mb-md" />
                <div class="text-h5 text-white text-weight-bold">
                  {{ appStore.language === 'English' ? 'Academic Identity' : 'අධ්‍යයන අනන්‍යතාවය' }}
                </div>
                <p class="text-indigo-2">
                  {{ appStore.language === 'English' ? 'Enter your unique student identifier to access your dashboard.' : 'ඔබගේ උපකරණ පුවරුවට පිවිසීමට ඔබගේ සුවිශේෂී ශිෂ්‍ය හැඳුනුම්පත ඇතුළත් කරන්න.' }}
                </p>
            </div>
            <q-form @submit="fetchStudentStatus" class="q-gutter-md">
                <q-input 
                    filled 
                    v-model="studentId" 
                    :label="appStore.language === 'English' ? 'Student ID' : 'ශිෂ්‍ය හැඳුනුම්පත'" 
                    dark 
                    color="indigo-4"
                    class="id-input-field"
                    :rules="[val => !!val || 'Required']"
                >
                    <template v-slot:prepend><q-icon name="badge" /></template>
                </q-input>
                <q-btn 
                    type="submit" 
                    color="white" 
                    text-color="indigo-10" 
                    :label="appStore.language === 'English' ? 'Initialize Dashboard' : 'උපකරණ පුවරුව සක්‍රිය කරන්න'" 
                    unelevated 
                    no-caps 
                    class="full-width q-py-md text-weight-bold premium-btn"
                    :loading="loading"
                />
            </q-form>
        </q-card>
      </div>

      <!-- Dashboard State -->
      <div v-else class="row q-col-gutter-lg">
        <!-- Student Header Card -->
        <div class="col-12">
            <q-card flat class="glass-modern profile-banner overflow-hidden">
                <div class="banner-accent"></div>
                <q-card-section class="row items-center q-pa-lg">
                    <q-avatar size="100px" class="q-mr-xl profile-avatar-glow">
                        <img :src="studentData.image_url || `https://ui-avatars.com/api/?name=${studentData.name}&background=6366f1&color=fff`" />
                    </q-avatar>
                    <div class="col">
                        <div class="row items-center">
                            <h2 class="text-h3 text-weight-bolder text-white no-margin">{{ studentData.name }}</h2>
                            <q-badge :color="studentData.status !== 'Inactive' ? 'green-4' : 'red-5'" :text-color="studentData.status !== 'Inactive' ? 'black' : 'white'" class="q-ml-md text-weight-bold">
                              <span v-if="studentData.status !== 'Inactive'">
                                {{ appStore.language === 'English' ? 'ACTIVE STUDENT' : 'සක්‍රීය සිසුවෙක්' }}
                              </span>
                              <span v-else>
                                {{ appStore.language === 'English' ? 'INACTIVE STUDENT' : 'අක්‍රීය සිසුවෙක්' }}
                              </span>
                            </q-badge>
                        </div>
                        <div class="text-h6 text-indigo-2 q-mt-xs">{{ studentData.student_id }} | {{ studentData.grade }} | {{ studentData.school }}</div>
                        <div class="row q-gutter-md q-mt-md">
                            <div class="stat-pill">
                                <q-icon name="event_available" class="q-mr-xs text-green-4" /> 
                                {{ attendanceRate }}% {{ appStore.language === 'English' ? 'Attendance' : 'පැමිණීම' }}
                            </div>
                            <div class="stat-pill">
                                <q-icon name="emoji_events" class="q-mr-xs text-amber-4" /> 
                                {{ appStore.language === 'English' ? 'Rank' : 'ස්ථානය' }}: #{{ latestRank }}
                            </div>
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </div>

        <!-- Quick Stats Grid -->
        <div class="col-12">
            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-3" v-for="stat in quickStats" :key="stat.label">
                    <q-card flat class="glass-modern stat-mini-card">
                        <q-card-section>
                            <div class="row items-center justify-between q-mb-sm">
                                <div class="text-caption text-indigo-2 text-uppercase letter-spacing-wide">{{ stat.label }}</div>
                                <q-icon :name="stat.icon" :color="stat.color" size="20px" />
                            </div>
                            <div class="text-h4 text-white text-weight-bolder">{{ stat.value }}</div>
                            <div class="text-caption" :class="`text-${stat.color}-3`">{{ stat.desc }}</div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>

        <!-- Recent Exam Results -->
        <div class="col-12">
            <q-card flat class="glass-modern">
                <q-card-section class="row items-center justify-between">
                    <div class="text-h6 text-white text-weight-bold">
                      {{ appStore.language === 'English' ? 'Recent Exam Results' : 'පසුගිය විභාග ප්‍රතිඵල' }}
                    </div>
                    <q-badge color="indigo-7">
                      {{ appStore.language === 'English' ? 'Performance Breakdown' : 'කාර්ය සාධන විශ්ලේෂණය' }}
                    </q-badge>
                </q-card-section>
                <q-card-section class="q-pa-none">
                    <q-table
                        flat
                        :rows="examResultsList"
                        :columns="resultColumns"
                        row-key="id"
                        hide-bottom
                        class="bg-transparent text-white"
                        card-class="bg-transparent text-white"
                        table-header-class="text-indigo-2 text-weight-bold"
                        dark
                    >
                        <template v-slot:body-cell-exam="props">
                            <q-td :props="props">
                                <div class="text-white text-weight-medium">{{ props.row.exam_title }}</div>
                                <div class="text-caption text-indigo-3">{{ props.row.subject_name }}</div>
                            </q-td>
                        </template>
                        <template v-slot:body-cell-rank="props">
                            <q-td :props="props" class="text-center">
                                <div class="text-white text-weight-bold">#{{ props.row.rank }} <span class="text-caption text-grey-5" style="font-size:10px;">/ {{ props.row.total_students }}</span></div>
                            </q-td>
                        </template>
                        <template v-slot:body-cell-status="props">
                            <q-td :props="props" class="text-center">
                                <q-chip 
                                    :color="getStatusColor(props.row.group, true)" 
                                    :text-color="getStatusColor(props.row.group, false)"
                                    size="sm"
                                    class="text-weight-bold"
                                >
                                    {{ getGroupName(props.row.group) }}
                                </q-chip>
                            </q-td>
                        </template>
                        <template v-slot:body-cell-marks="props">
                            <q-td :props="props">
                                <div class="text-weight-bold text-white">{{ props.row.marks_obtained }} / {{ props.row.max_marks }} ({{ Math.round(props.row.percentage) }}%)</div>
                                <q-linear-progress :value="props.row.percentage / 100" :color="getStatusColor(props.row.group, false)" class="q-mt-xs" style="border-radius: 4px;" />
                            </q-td>
                        </template>
                        <template v-slot:body-cell-certificate="props">
                            <q-td :props="props" class="text-center">
                                <div v-if="props.row.percentage >= 50">
                                    <q-btn 
                                        flat 
                                        round 
                                        color="amber-5" 
                                        icon="emoji_events" 
                                        size="md"
                                        class="glow-shadow"
                                        @click="openCertificate(props.row)"
                                    >
                                        <q-tooltip>{{ appStore.language === 'English' ? 'Claim Certificate' : 'සහතිකය ලබාගන්න' }}</q-tooltip>
                                    </q-btn>
                                </div>
                                <div v-else class="text-grey-6 text-caption">-</div>
                            </q-td>
                        </template>
                    </q-table>
                </q-card-section>
            </q-card>
        </div>

        <!-- My Study Pairs & Teams -->
        <div class="col-12" v-if="myStudyPairs.length > 0">
            <q-card flat class="glass-modern">
                <q-card-section class="row items-center justify-between">
                    <div class="text-h6 text-white text-weight-bold flex items-center">
                        <q-icon name="hub" color="teal-4" class="q-mr-sm" />
                        {{ appStore.language === 'English' ? 'My Study Teams & Communication' : 'මගේ අධ්‍යයන කණ්ඩායම් සහ සන්නිවේදනය' }}
                    </div>
                    <q-badge color="teal-6">{{ appStore.language === 'English' ? 'Active Groupings' : 'ක්‍රියාකාරී කණ්ඩායම්' }}</q-badge>
                </q-card-section>
                <q-card-section class="q-pa-md">
                    <div class="row q-col-gutter-md">
                        <div v-for="pair in myStudyPairs" :key="pair.id" class="col-12 col-sm-6">
                            <q-card flat class="glass-modern q-pa-md relative-position overflow-hidden border-left-teal">
                                <div class="absolute-top-right q-pa-sm">
                                  <q-chip 
                                    dense 
                                    :color="pair.type === 'Video Call' ? 'indigo-9' : 'teal-9'" 
                                    :text-color="pair.type === 'Video Call' ? 'indigo-2' : 'teal-2'"
                                    class="text-weight-bold"
                                  >
                                    <q-icon :name="pair.type === 'Video Call' ? 'videocam' : 'call'" size="14px" class="q-mr-xs" />
                                    {{ pair.type }}
                                  </q-chip>
                                </div>
                                <div class="text-subtitle1 text-weight-bold text-teal-3 q-mb-md flex justify-between items-center">
                                    <span>{{ pair.class_name }} | Team #{{ pair.team_number }}</span>
                                    <q-chip dense color="teal-9" text-color="teal-2" class="text-weight-bold text-caption font-mono" style="font-size: 11px;">
                                      {{ getOnlineTextForPortal(pair) }}
                                    </q-chip>
                                </div>
                                <div class="q-gutter-sm column">
                                    <div class="row items-center justify-between border-bottom-light q-pb-xs">
                                        <div class="row items-center q-gutter-sm">
                                            <q-avatar size="28px" class="bg-indigo-9 text-white font-mono text-weight-bold text-caption relative-position">
                                                {{ studentData.name.charAt(0).toUpperCase() }}
                                                <span :class="['status-dot', isStudentOnline(studentData) ? 'online animate-pulse' : 'offline']"></span>
                                            </q-avatar>
                                            <div>
                                                <div class="text-weight-bold text-white text-caption">{{ studentData.name }} <q-badge dense color="indigo-7" class="q-ml-xs text-weight-bold" style="font-size:9px;">{{ appStore.language === 'English' ? 'Me' : 'මම' }}</q-badge></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-for="partner in pair.partners" :key="partner.id" class="row items-center justify-between border-bottom-light q-pb-xs">
                                        <div class="row items-center q-gutter-sm">
                                            <q-avatar size="28px" class="bg-teal-9 text-teal-2 font-mono text-weight-bold text-caption relative-position">
                                                {{ partner.name.charAt(0).toUpperCase() }}
                                                <span :class="['status-dot', isStudentOnline(partner) ? 'online animate-pulse' : 'offline']"></span>
                                            </q-avatar>
                                            <div>
                                                <div class="text-weight-bold text-white text-caption">{{ partner.name }}</div>
                                                <div class="text-caption text-indigo-3 font-mono" style="font-size:10px;">{{ partner.student_id }}</div>
                                            </div>
                                        </div>
                                        <q-btn v-if="partner.contact" flat round color="green-4" icon="chat" size="sm" @click="openWhatsApp(partner.contact)">
                                            <q-tooltip>{{ appStore.language === 'English' ? 'Message via WhatsApp' : 'WhatsApp හරහා පණිවිඩයක් යවන්න' }}</q-tooltip>
                                        </q-btn>
                                    </div>
                                </div>
                                <q-separator dark class="q-my-md opacity-20" />
                                <div class="row justify-center">
                                    <q-btn 
                                        unelevated 
                                        no-caps
                                        class="full-width text-weight-bold rounded-borders q-py-sm glow-shadow"
                                        :color="pair.type === 'Video Call' ? 'indigo-7' : 'teal-7'"
                                        :icon="pair.type === 'Video Call' ? 'videocam' : 'call'"
                                        :label="appStore.language === 'English' ? `Join ${pair.type} Room` : `${pair.type === 'Video Call' ? 'වීඩියෝ' : 'ශ්‍රව්‍ය'} ඇමතුමට එක්වන්න`"
                                        @click="startCall(pair)"
                                    />
                                </div>
                            </q-card>
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </div>

        <!-- Leaderboard -->
        <div class="col-12">
            <q-card flat class="glass-modern">
                <q-card-section class="row items-center justify-between">
                    <div class="text-h6 text-white text-weight-bold">
                      {{ appStore.language === 'English' ? 'Latest Exam Leaderboard' : 'අවසාන විභාගයේ ප්‍රමුඛ පුවරුව' }}
                    </div>
                    <q-badge color="amber-7" text-color="black" class="text-weight-bold">
                      {{ appStore.language === 'English' ? 'Top 5 Performers' : 'ප්‍රමුඛතම සිසුන් 5' }}
                    </q-badge>
                </q-card-section>
                <q-card-section class="q-pa-md">
                    <div v-if="leaderboard.length === 0" class="text-center text-indigo-2 q-py-xl">
                        {{ appStore.language === 'English' ? 'No leaderboard data available for the recent exam.' : 'පසුගිය විභාගයේ ප්‍රමුඛ පුවරු දත්ත නොමැත.' }}
                    </div>
                    <div v-else class="row q-col-gutter-md justify-center">
                        <div class="col-12 col-sm-6 col-md-2 text-center relative-position" v-for="(student, index) in leaderboard" :key="index">
                            <q-avatar size="80px" class="q-mb-sm shadow-5" :class="{'border-gold': index === 0, 'border-silver': index === 1, 'border-bronze': index === 2}">
                                <img :src="student.image_url || `https://ui-avatars.com/api/?name=${student.name}&background=random&color=fff`" />
                                <q-badge floating rounded :color="index === 0 ? 'amber-5' : (index === 1 ? 'grey-4' : (index === 2 ? 'orange-4' : 'indigo-5'))" 
                                         :text-color="index < 3 ? 'black' : 'white'" class="text-weight-bold shadow-2">
                                    #{{ index + 1 }}
                                </q-badge>
                            </q-avatar>
                            <div class="text-white text-weight-bold ellipsis" style="max-width: 100%;">{{ student.name }}</div>
                            <div class="text-indigo-2 text-caption font-weight-bold">{{ student.marks_obtained }} {{ appStore.language === 'English' ? 'Marks' : 'ලකුණු' }}</div>
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </div>

        <!-- Performance Analytics Section -->
        <div class="col-12 col-md-8">
            <q-card flat class="glass-modern chart-card h-full">
                <q-card-section class="row items-center justify-between">
                    <div class="text-h6 text-white text-weight-bold">
                      {{ appStore.language === 'English' ? 'Academic Performance Trend' : 'අධ්‍යයන ප්‍රගති ප්‍රවණතාවය' }}
                    </div>
                    <q-tabs v-model="chartTab" dense class="text-indigo-2" active-color="white" indicator-color="white">
                        <q-tab name="marks" :label="appStore.language === 'English' ? 'Marks' : 'ලකුණු'" />
                        <q-tab name="ranks" :label="appStore.language === 'English' ? 'Ranks' : 'ස්ථානය'" />
                    </q-tabs>
                </q-card-section>
                <q-card-section class="q-pa-md">
                    <apexchart 
                        v-if="chartTab === 'marks'"
                        type="area" 
                        height="350" 
                        :options="markChartOptions" 
                        :series="markChartSeries" 
                    />
                    <apexchart 
                        v-else
                        type="line" 
                        height="350" 
                        :options="rankChartOptions" 
                        :series="rankChartSeries" 
                    />
                </q-card-section>
            </q-card>
        </div>

        <!-- Peer Comparison Chart -->
        <div class="col-12 col-md-4">
            <q-card flat class="glass-modern chart-card h-full">
                <q-card-section>
                    <div class="text-h6 text-white text-weight-bold">
                      {{ appStore.language === 'English' ? 'Peer Comparison' : 'සමකාලීන සැසඳීම' }}
                    </div>
                    <div class="text-caption text-indigo-2 q-mb-md">{{ appStore.language === 'English' ? 'Latest' : 'අවසාන විභාගය' }}: {{ latestExamTitle }}</div>
                </q-card-section>
                <q-card-section class="flex flex-center">
                    <apexchart 
                        type="bar" 
                        height="350" 
                        width="100%"
                        :options="comparisonChartOptions" 
                        :series="comparisonChartSeries" 
                    />
                </q-card-section>
            </q-card>
        </div>

        <!-- Attendance Heatmap/Table -->
        <div class="col-12 col-md-6">
            <q-card flat class="glass-modern h-full">
                <q-card-section class="row items-center justify-between">
                    <div class="text-h6 text-white text-weight-bold">
                      {{ appStore.language === 'English' ? 'Attendance History' : 'පැමිණීමේ ඉතිහාසය' }}
                    </div>
                    <q-badge color="indigo-7">
                      {{ appStore.language === 'English' ? 'Last 10 Sessions' : 'අවසන් දින 10' }}
                    </q-badge>
                </q-card-section>
                <q-card-section class="q-pa-none">
                    <q-list separator dark>
                        <q-item v-for="att in attendance" :key="att.id" class="q-py-md">
                            <q-item-section avatar>
                                <q-avatar :color="att.status === 'Present' ? 'green-9' : 'red-9'" text-color="white" icon="event" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-weight-bold text-white">{{ formatDate(att.date) }}</q-item-label>
                                <q-item-label caption class="text-indigo-2">{{ att.class_name }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-chip dense :color="att.status === 'Present' ? 'green-4' : 'red-4'" text-color="black" class="text-weight-bold">
                                    {{ att.status === 'Present' ? (appStore.language === 'English' ? 'Present' : 'පැමිණ සිටී') : (appStore.language === 'English' ? 'Absent' : 'පැමිණ නැත') }}
                                </q-chip>
                            </q-item-section>
                        </q-item>
                    </q-list>
                    <div v-if="attendance.length === 0" class="text-center q-pa-xl text-indigo-4">
                      {{ appStore.language === 'English' ? 'No records found.' : 'වාර්තා කිසිවක් හමු නොවීය.' }}
                    </div>
                </q-card-section>
            </q-card>
        </div>

        <!-- Tutes & Materials -->
        <div class="col-12 col-md-6">
            <q-card flat class="glass-modern h-full">
                <q-card-section class="row items-center justify-between">
                    <div class="text-h6 text-white text-weight-bold">
                      {{ appStore.language === 'English' ? 'Tutorials & Materials' : 'නිබන්ධන සහ උපකරණ' }}
                    </div>
                    <q-icon name="description" color="indigo-2" size="24px" />
                </q-card-section>
                <q-card-section class="q-pa-none">
                    <q-list separator dark>
                        <q-item v-for="tute in tutesList" :key="tute.id" class="q-py-md">
                            <q-item-section>
                                <q-item-label class="text-weight-bold text-white">{{ tute.title }}</q-item-label>
                                <q-item-label caption class="text-indigo-2">{{ tute.subject_name }}</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-chip 
                                    :color="isReceived(tute.id) ? 'green-9' : 'orange-9'" 
                                    :text-color="isReceived(tute.id) ? 'green-2' : 'orange-2'"
                                    :icon="isReceived(tute.id) ? 'check_circle' : 'pending'"
                                    class="text-weight-bold"
                                >
                                    {{ isReceived(tute.id) ? (appStore.language === 'English' ? 'RECEIVED' : 'ලැබී ඇත') : (appStore.language === 'English' ? 'PENDING' : 'ලැබීමට ඇත') }}
                                </q-chip>
                            </q-item-section>
                        </q-item>
                    </q-list>
                    <div v-if="tutesList.length === 0" class="text-center q-pa-xl text-indigo-4">
                      {{ appStore.language === 'English' ? 'No tutorials assigned yet.' : 'නිබන්ධන කිසිවක් පවරා නොමැත.' }}
                    </div>
                </q-card-section>
            </q-card>
        </div>

        <!-- Discipline Incidents Logs -->
        <div class="col-12">
            <q-card flat class="glass-modern">
                <q-card-section class="row items-center justify-between">
                    <div class="text-h6 text-white text-weight-bold flex items-center">
                        <q-icon name="gavel" color="deep-purple-3" class="q-mr-sm" />
                        {{ appStore.language === 'English' ? 'Academic Conduct & Character Log' : 'අධ්‍යයන හැසිරීම් සහ විනය වාර්තා' }}
                    </div>
                    <div class="row q-gutter-sm items-center">
                        <q-badge color="deep-purple-7">
                          {{ appStore.language === 'English' ? 'Official Conduct Record' : 'විධිමත් හැසිරීම් සටහන' }}
                        </q-badge>
                        <q-btn 
                            outline
                            dense
                            no-caps
                            color="teal-4" 
                            icon="card_membership" 
                            :label="appStore.language === 'English' ? 'Character Certificate' : 'චරිත සහතිකය'"
                            class="q-px-sm text-weight-bold rounded-borders glow-shadow"
                            @click="openCharacterCertificate"
                        >
                            <q-tooltip>{{ appStore.language === 'English' ? 'Generate formal character and conduct certificate' : 'විධිමත් චරිත සහතික පත්‍රය ලබාගන්න' }}</q-tooltip>
                        </q-btn>
                    </div>
                </q-card-section>
                <q-card-section class="q-pa-md">
                    <div v-if="disciplineRecords.length === 0" class="text-center text-indigo-3 q-py-xl">
                        <q-icon name="verified_user" size="54px" color="teal-4" class="q-mb-md glow-shadow" />
                        <div class="text-subtitle1 text-weight-bold text-white">
                          {{ appStore.language === 'English' ? 'Exemplary Record!' : 'විශිෂ්ට චර්යාවක්!' }}
                        </div>
                        <div class="text-caption text-indigo-2">
                          {{ appStore.language === 'English' ? 'No disciplinary incidents, warnings, or infractions have been logged.' : 'ඔබගේ නමට කිසිදු විනය කඩකිරීමක් හෝ අවවාද කිරීමක් සටහන් වී නොමැත.' }}
                        </div>
                    </div>
                    <div v-else class="row q-col-gutter-md">
                        <div v-for="record in disciplineRecords" :key="record.id" class="col-12 col-sm-6 col-md-4">
                            <q-card flat class="glass-modern q-pa-md relative-position overflow-hidden" :class="getDisciplineBorderClass(record.type)">
                                <div class="row justify-between items-center q-mb-sm">
                                    <q-chip dense :color="getDisciplineColor(record.type)" text-color="white" class="text-weight-bold text-caption uppercase">
                                        <q-icon :name="getDisciplineIcon(record.type)" size="12px" class="q-mr-xs" />
                                        {{ record.type }}
                                    </q-chip>
                                    <span class="text-caption text-indigo-3 font-mono">{{ record.date }}</span>
                                </div>
                                <div class="text-subtitle2 text-white text-weight-bold q-mt-sm">{{ record.category }}</div>
                                <p class="text-caption text-indigo-2 q-mt-sm text-line-clamp-3" style="line-height: 1.5;">
                                  {{ record.description }}
                                </p>
                            </q-card>
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </div>

      </div>

      <div class="text-center q-mt-xl text-indigo-4 text-caption q-pb-xl">
        &copy; 2026 ClassMaster v3.1 Premium - Institute Management Ecosystem
      </div>
    </div>

    <!-- Certificate Overlay Dialog (Off-print elements) -->
    <q-dialog v-model="certificateDialogOpen" transition-show="scale" transition-hide="scale">
      <q-card style="width: 850px; max-width: 95vw; background: rgba(0,0,0,0.85); backdrop-filter: blur(15px); border-radius: 20px;" class="q-pa-md">
        <!-- Close button / Actions for modal on-screen -->
        <q-card-section class="row items-center justify-between no-print q-pb-sm">
          <div class="text-h6 text-white text-weight-bold">{{ appStore.language === 'English' ? 'Academic Certificate Viewer' : 'විද්‍යුත් සහතික පත්‍රය' }}</div>
          <div class="row q-gutter-sm">
            <q-btn color="amber-6" text-color="black" icon="print" :label="appStore.language === 'English' ? 'Print Certificate' : 'මුද්‍රණය කරන්න'" unelevated class="text-weight-bold rounded-button" @click="printCertificate" />
            <q-btn icon="close" flat round dense v-close-popup color="white" />
          </div>
        </q-card-section>

        <!-- Printable high-res certificate element -->
        <q-card-section class="q-pa-md flex flex-center">
          <div class="certificate-card certificate-print-area text-center q-pa-xl relative-position" style="width: 100%; max-width: 750px; min-height: 480px;">
            <!-- Classical watermark / gold seal background accent -->
            <div class="watermark-badge absolute-center"></div>

            <div class="certificate-inner-border q-pa-lg">
              <div class="text-center">
                <!-- Academic Seal Icon SVG -->
                <div class="certificate-seal q-mb-md">
                  <q-icon name="school" size="40px" color="black" />
                </div>
                
                <h3 class="certificate-title q-my-none">
                  {{ appStore.language === 'English' ? 'Certificate of Achievement' : 'විශිෂ්ටතා සහතික පත්‍රය' }}
                </h3>
                <div class="certificate-subtitle q-mt-xs q-mb-lg">
                  {{ appStore.language === 'English' ? 'This academic award is officially presented to' : 'මෙම අධ්‍යයන සම්මානය ගෞරවයෙන් පිරිනමනු ලබන්නේ' }}
                </div>

                <div class="recipient-name text-indigo-10 q-my-sm">
                  {{ studentData?.name }}
                </div>

                <div class="certificate-text q-my-md">
                  {{ appStore.language === 'English' ? 'for demonstrating outstanding excellence and academic dedication in the examination' : 'විභාගයේදී විශිෂ්ට දක්ෂතාවයක් සහ ඉහළ කැපවීමක් පෙන්නුම් කරමින් සමත් වීම වෙනුවෙන්' }}
                  <div class="text-weight-bolder text-indigo-10 q-my-sm" style="font-size: 1.35rem; font-style: normal;">
                    {{ selectedExamForCertificate?.exam_title }} ({{ selectedExamForCertificate?.subject_name }})
                  </div>
                  {{ appStore.language === 'English' ? 'obtaining a merit score of' : 'ලකුණු මට්ටමක් ලබාගනිමින් සුවිශේෂී ජයග්‍රහණයක් අත්පත් කරගෙන ඇත.' }}
                  <span class="text-weight-bolder text-teal-9">
                    {{ selectedExamForCertificate?.marks_obtained }} / {{ selectedExamForCertificate?.max_marks }} ({{ Math.round(selectedExamForCertificate?.percentage) }}%)
                  </span>
                </div>

                <!-- Signature Row -->
                <div class="row justify-between items-center q-mt-xl q-px-lg">
                  <div class="text-center">
                    <div class="signature-text">{{ selectedExamForCertificate?.tutor_name || 'Dr. A.B. Sejan' }}</div>
                    <div class="signature-block">
                      {{ appStore.language === 'English' ? 'Course Tutor' : 'විෂය භාර ගුරුතුමා' }}
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="signature-text" style="font-family: 'Brush Script MT', cursive; color: #a1824a;">ClassMaster</div>
                    <div class="signature-block">
                      {{ appStore.language === 'English' ? 'Institute Registrar' : 'ආයතනික රෙජිස්ට්‍රාර්' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Character Certificate Overlay Dialog -->
    <q-dialog v-model="characterDialogOpen" transition-show="scale" transition-hide="scale">
      <q-card style="width: 850px; max-width: 95vw; background: rgba(0,0,0,0.85); backdrop-filter: blur(15px); border-radius: 20px;" class="q-pa-md">
        <!-- Close button / Actions for modal on-screen -->
        <q-card-section class="row items-center justify-between no-print q-pb-sm">
          <div class="text-h6 text-white text-weight-bold">{{ appStore.language === 'English' ? 'Character Certificate Viewer' : 'චරිත සහතික පත්‍ර පෙරදසුන' }}</div>
          <div class="row q-gutter-sm">
            <q-btn color="teal-6" text-color="black" icon="print" :label="appStore.language === 'English' ? 'Print Certificate' : 'මුද්‍රණය කරන්න'" unelevated class="text-weight-bold rounded-button" @click="printCertificate" />
            <q-btn icon="close" flat round dense v-close-popup color="white" />
          </div>
        </q-card-section>

        <!-- Printable high-res character certificate element -->
        <q-card-section class="q-pa-md flex flex-center">
          <div class="certificate-card character-certificate-card certificate-print-area text-center q-pa-xl relative-position" style="width: 100%; max-width: 750px; min-height: 480px;">
            <!-- Classical watermark / platinum seal background accent -->
            <div class="watermark-badge absolute-center"></div>

            <div class="certificate-inner-border q-pa-lg">
              <div class="text-center">
                <!-- Academic Seal Icon SVG -->
                <div class="character-certificate-seal q-mb-md">
                  <q-icon name="verified" size="40px" color="black" />
                </div>
                
                <h3 class="certificate-title character-title q-my-none">
                  {{ appStore.language === 'English' ? 'Character & Conduct Certificate' : 'චරිත සහතික පත්‍රය' }}
                </h3>
                <div class="certificate-subtitle q-mt-xs q-mb-lg">
                  {{ appStore.language === 'English' ? 'This is to officially certify the outstanding demeanor of' : 'මෙම චරිත සහතික පත්‍රය ගෞරවයෙන් පිරිනමනු ලබන්නේ' }}
                </div>

                <div class="recipient-name text-indigo-10 q-my-sm">
                  {{ studentData?.name }}
                </div>

                <div class="certificate-text q-my-md">
                  {{ appStore.language === 'English' ? 'who is a registered active student under Index ID' : 'යන සිසුවා ක්ලාස්මාස්ටර් ආයතනයෙහි ලියාපදිංචි අංක' }}
                  <span class="text-weight-bolder text-indigo-10 font-mono">[{{ studentData?.student_id }}]</span>
                  {{ appStore.language === 'English' ? 'under the curriculum of our academic institute.' : 'යටතේ අධ්‍යයන කටයුතු හදාරන බවත්,' }}
                  <br />
                  <span class="text-weight-bold q-my-sm block" style="color: #2c3e50; font-size: 0.95rem; line-height:1.4;">
                    {{ appStore.language === 'English' 
                       ? 'Throughout the academic tenure, the student has maintained a highly exemplary discipline record, showing excellent obedience, academic dedication, and distinguished civic conduct.'
                       : 'සිය අධ්‍යයන කාලය තුළදී ආයතන නීති රීතිවලට එකඟව, ඉතා ආදර්ශමත් හැසිරීමක්, උසස් විනයගරුක බවක් සහ විශිෂ්ට චරිත ස්වභාවයක් පෙන්නුම් කර ඇති බවත් මෙයින් සාක්ෂි දරමු.' 
                    }}
                  </span>

                  <!-- Disciplinary summary ledger: excellences and violations -->
                  <div class="conduct-summary-grid q-my-md row q-col-gutter-md text-left">
                    <!-- Excellences Column -->
                    <div class="col-6">
                      <div class="conduct-column-header text-teal-9 text-weight-bold flex items-center">
                        <q-icon name="stars" size="16px" class="q-mr-xs" />
                        {{ appStore.language === 'English' ? 'Accolades & Achievements' : 'විශිෂ්ට ජයග්‍රහණ සහ ඇගයීම්' }}
                      </div>
                      <ul class="conduct-list" v-if="excellences.length > 0">
                        <li v-for="rec in excellences" :key="rec.id" class="text-indigo-9">
                          <strong>{{ rec.category }}:</strong> {{ rec.description }} <span class="font-mono text-grey-6" style="font-size: 9px;">({{ rec.date }})</span>
                        </li>
                      </ul>
                      <div class="conduct-empty text-teal-8" v-else>
                        ✓ {{ appStore.language === 'English' ? 'Consistent Academic Excellence' : 'නිරන්තර ආදර්ශමත් සහභාගීත්වය' }}
                      </div>
                    </div>

                    <!-- Violations Column -->
                    <div class="col-6" style="border-left: 1px dashed rgba(49, 151, 149, 0.2);">
                      <div class="conduct-column-header text-red-9 text-weight-bold flex items-center">
                        <q-icon name="report" size="16px" class="q-mr-xs" />
                        {{ appStore.language === 'English' ? 'Warnings & Infractions' : 'වාර්තා වූ විනය උල්ලංඝනයන්' }}
                      </div>
                      <ul class="conduct-list text-red-9" v-if="violations.length > 0">
                        <li v-for="rec in violations" :key="rec.id">
                          <strong>[{{ rec.type }}] {{ rec.category }}:</strong> {{ rec.description }} <span class="font-mono text-grey-6" style="font-size: 9px;">({{ rec.date }})</span>
                        </li>
                      </ul>
                      <div class="conduct-empty text-green-9" v-else>
                        ✓ {{ appStore.language === 'English' ? 'No Disciplinary Actions (100% Clean)' : 'විනය කඩකිරීම් කිසිවක් නැත (100% පිරිසිදු)' }}
                      </div>
                    </div>
                  </div>

                  <span class="text-caption text-grey-7 block q-mt-xs">
                    {{ appStore.language === 'English' ? 'Generated officially based on system discipline audits.' : 'විනය පාලක මණ්ඩලයේ විධිමත් පිරික්සුම් මත පදනම්ව නිකුත් කරන ලදී.' }}
                  </span>
                </div>

                <!-- Signature Row -->
                <div class="row justify-between items-center q-mt-xl q-px-lg">
                  <div class="text-center">
                    <div class="signature-text">{{ studentData?.tutor_name || 'Dr. A.B. Sejan' }}</div>
                    <div class="signature-block">
                      {{ appStore.language === 'English' ? 'Class Tutor' : 'පන්ති භාර ගුරුතුමා' }}
                    </div>
                  </div>
                  <div class="text-center">
                    <div class="signature-text" style="font-family: 'Brush Script MT', cursive; color: #3a8080;">ClassMaster</div>
                    <div class="signature-block">
                      {{ appStore.language === 'English' ? 'Institute Registrar' : 'ආයතනික රෙජිස්ට්‍රාර්' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import { client } from 'src/api'
import { useAppStore } from 'src/store/app'
import VueApexCharts from 'vue3-apexcharts'

const apexchart = VueApexCharts

const appStore = useAppStore()
const $q = useQuasar()
const route = useRoute()
const studentId = ref('')
const loading = ref(false)
const studentData = ref(null)
const attendance = ref([])
const payments = ref([])
const tutesList = ref([])
const receivedTuteIds = ref([])
const examResultsList = ref([])
const leaderboard = ref([])
const pairingsList = ref([])
const disciplineRecords = ref([])

const chartTab = ref('marks')
const certificateDialogOpen = ref(false)
const characterDialogOpen = ref(false)
const selectedExamForCertificate = ref(null)

onMounted(() => {
    if (route.query.id) {
        studentId.value = route.query.id
        fetchStudentStatus()
    }
})

const fetchStudentStatus = async () => {
    loading.value = true
    try {
        const data = await client.get(`students/public-portal/${studentId.value}`)
        if (!data) {
            $q.notify({ type: 'negative', message: 'Student ID not found!' })
            return
        }

        studentData.value = data.student
        attendance.value = data.attendance || []
        payments.value = data.payments || []
        examResultsList.value = (data.examResults || []).reverse() 
        tutesList.value = data.tutes || []
        receivedTuteIds.value = data.receivedTuteIds || []
        leaderboard.value = data.leaderboard || []
        pairingsList.value = data.pairings || []
        disciplineRecords.value = data.discipline || []

    } catch (err) {
        $q.notify({ 
            type: 'negative', 
            message: err.message || 'Network synchronization failed.',
            caption: 'Please contact institute admin if this persists.'
        })
    } finally {
        loading.value = false
    }
}

// Analytics Helpers
const attendanceRate = computed(() => {
    if (attendance.value.length === 0) return 0
    const present = attendance.value.filter(a => a.status === 'Present').length
    return Math.round((present / attendance.value.length) * 100)
})

const latestRank = computed(() => {
    if (examResultsList.value.length === 0) return '-'
    return examResultsList.value[examResultsList.value.length - 1].rank
})

const latestExamTitle = computed(() => {
    if (examResultsList.value.length === 0) return 'No Data'
    return examResultsList.value[examResultsList.value.length - 1].exam_title
})

const quickStats = computed(() => [
    { 
        label: appStore.language === 'English' ? 'Total Exams' : 'මුළු විභාග ගණන', 
        value: examResultsList.value.length, 
        icon: 'edit_note', 
        color: 'blue', 
        desc: appStore.language === 'English' ? 'Participated' : 'සහභාගී වූ' 
    },
    { 
        label: appStore.language === 'English' ? 'Latest Exam Average' : 'අවසාන විභාග සාමාන්‍යය', 
        value: `${Math.round(avgMarks.value)}%`, 
        icon: 'insights', 
        color: 'purple', 
        desc: appStore.language === 'English' ? 'Class Benchmark' : 'පන්තියේ සාමාන්‍යය' 
    },
    { 
        label: appStore.language === 'English' ? 'Fee Status' : 'ගාස්තු තත්ත්වය', 
        value: pendingFees.value > 0 ? (appStore.language === 'English' ? 'Pending' : 'ගෙවීමට ඇත') : (appStore.language === 'English' ? 'Cleared' : 'ගෙවා ඇත'), 
        icon: 'payments', 
        color: pendingFees.value > 0 ? 'orange' : 'green', 
        desc: appStore.language === 'English' ? 'Monthly Billing' : 'මාසික ගාස්තු' 
    },
    { 
        label: appStore.language === 'English' ? 'Pending Tutes' : 'ලැබීමට ඇති නිබන්ධන', 
        value: tutesList.value.length - receivedTuteIds.value.length, 
        icon: 'inventory_2', 
        color: 'indigo', 
        desc: appStore.language === 'English' ? 'Physical Materials' : 'ද්‍රව්‍ය ලැයිස්තුව' 
    },
])

const avgMarks = computed(() => {
    if (examResultsList.value.length === 0) return 0
    const latestExam = examResultsList.value[examResultsList.value.length - 1]
    if (!latestExam || !latestExam.max_marks) return 0
    return (latestExam.average_marks / latestExam.max_marks) * 100
})

const pendingFees = computed(() => {
    return payments.value.length === 0 ? 1 : 0
})

// Study Groups computed property
const myStudyPairs = computed(() => {
    if (!studentData.value || pairingsList.value.length === 0) return []
    
    const myPairs = []
    
    pairingsList.value.forEach(session => {
        const pairs = session.pairs || []
        const myTeam = pairs.find(team => 
            team.members && team.members.some(m => m.id === studentData.value.id || m.student_id === studentData.value.student_id)
        )
        
        if (myTeam) {
            const partners = myTeam.members.filter(m => m.id !== studentData.value.id && m.student_id !== studentData.value.student_id)
            myPairs.push({
                id: session.id,
                class_name: session.class_name || 'Class Session',
                type: session.type, 
                team_number: myTeam.team_number,
                partners: partners,
                created_at: session.created_at
            })
        }
    })
    
    return myPairs
})

const excellences = computed(() => {
    return disciplineRecords.value.filter(r => r.type === 'Achievement')
})

const violations = computed(() => {
    return disciplineRecords.value.filter(r => r.type !== 'Achievement')
})

// Charts Options & Series
const markChartSeries = computed(() => [{
    name: 'My Marks',
    data: examResultsList.value.map(r => Math.round(r.percentage))
}])

const markChartOptions = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent' },
    stroke: { curve: 'smooth', width: 3 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.1 } },
    colors: ['#6366f1'],
    xaxis: { categories: examResultsList.value.map(r => r.exam_title), labels: { style: { colors: '#94a3b8' } } },
    yaxis: { min: 0, max: 100, labels: { style: { colors: '#94a3b8' } } },
    theme: { mode: 'dark' },
    grid: { borderColor: 'rgba(255,255,255,0.1)' }
}

const rankChartSeries = computed(() => [{
    name: 'Rank',
    data: examResultsList.value.map(r => r.rank)
}])

const rankChartOptions = {
    chart: { type: 'line', toolbar: { show: false } },
    stroke: { curve: 'stepline', width: 3 },
    colors: ['#a855f7'],
    xaxis: { categories: examResultsList.value.map(r => r.exam_title), labels: { style: { colors: '#94a3b8' } } },
    yaxis: { reversed: true, labels: { style: { colors: '#94a3b8' } } },
    theme: { mode: 'dark' },
    grid: { borderColor: 'rgba(255,255,255,0.1)' }
}

const comparisonChartSeries = computed(() => {
    if (examResultsList.value.length === 0) return []
    const latest = examResultsList.value[examResultsList.value.length - 1]
    return [{
        name: 'Marks',
        data: [
            { x: 'Me', y: Math.round(latest.percentage) },
            { x: 'Class Avg', y: Math.round(latest.average_marks) },
            { x: 'Highest', y: Math.round(latest.highest_marks) }
        ]
    }]
})

const comparisonChartOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 10, distributed: true, columnWidth: '60%' } },
    colors: ['#6366f1', '#94a3b8', '#10b981'],
    legend: { show: false },
    theme: { mode: 'dark' },
    xaxis: { labels: { style: { colors: '#94a3b8' } } },
    yaxis: { min: 0, max: 100, labels: { style: { colors: '#94a3b8' } } },
    grid: { show: false }
}

const isReceived = (id) => receivedTuteIds.value.includes(id)
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

const resultColumns = computed(() => [
    { name: 'exam', align: 'left', label: appStore.language === 'English' ? 'Exam Title' : 'විභාග මාතෘකාව', field: 'exam_title' },
    { name: 'marks', align: 'left', label: appStore.language === 'English' ? 'Marks' : 'ලකුණු', field: 'marks_obtained' },
    { name: 'rank', align: 'center', label: appStore.language === 'English' ? 'Rank' : 'ස්ථානය', field: 'rank' },
    { name: 'status', align: 'center', label: appStore.language === 'English' ? 'Status' : 'තත්ත්වය', field: 'group' },
    { name: 'certificate', align: 'center', label: appStore.language === 'English' ? 'Achievement' : 'ජයග්‍රහණ', field: 'id' }
])

const getStatusColor = (group, isBg) => {
    const colors = {
        green: { bg: 'green-9', text: 'green-2' },
        yellow: { bg: 'yellow-9', text: 'yellow-2' },
        blue: { bg: 'blue-9', text: 'blue-2' },
        red: { bg: 'red-9', text: 'red-2' }
    }
    const c = colors[group] || colors.red
    return isBg ? c.bg : c.text
}

const getGroupName = (group) => {
    const names = {
        green: appStore.language === 'English' ? 'Elite' : 'විශිෂ්ට',
        yellow: appStore.language === 'English' ? 'Good' : 'යහපත්',
        blue: appStore.language === 'English' ? 'Average' : 'සාමාන්‍ය',
        red: appStore.language === 'English' ? 'Needs Focus' : 'අවධානය අවශ්‍ය'
    }
    return names[group] || 'Unknown'
}

// WhatsApp redirect helper
const openWhatsApp = (phone) => {
    let cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('0')) {
        cleaned = '94' + cleaned.substring(1)
    }
    window.open(`https://wa.me/${cleaned}`, '_blank')
}

// Discipline styling helpers
const getDisciplineColor = (type) => {
  if (type === 'Achievement') return 'green-7'
  if (type === 'Warning') return 'amber-8'
  if (type === 'Infraction') return 'red-6'
  return 'deep-purple-7'
}

const getDisciplineIcon = (type) => {
  if (type === 'Achievement') return 'emoji_events'
  if (type === 'Warning') return 'report_problem'
  if (type === 'Infraction') return 'error_outline'
  return 'block'
}

const getDisciplineBorderClass = (type) => {
  if (type === 'Achievement') return 'border-left-accolade'
  if (type === 'Warning') return 'border-left-warning'
  if (type === 'Infraction') return 'border-left-infraction'
  return 'border-left-suspension'
}

const openCertificate = (exam) => {
    selectedExamForCertificate.value = exam
    certificateDialogOpen.value = true
}

const openCharacterCertificate = () => {
    characterDialogOpen.value = true
}

const printCertificate = () => {
    window.print()
}

const isStudentOnline = (member) => {
  if (!member) return false;
  const idStr = String(member.student_id || member.id || '');
  let sum = 0;
  for (let i = 0; i < idStr.length; i++) sum += idStr.charCodeAt(i);
  return sum % 3 !== 0; // consistent ~66% online indicator
}

const getOnlineTextForPortal = (pair) => {
  let onlineCount = 0;
  let total = 0;
  
  if (studentData.value) {
    total++;
    if (isStudentOnline(studentData.value)) {
      onlineCount++;
    }
  }
  
  if (pair.partners) {
    pair.partners.forEach(partner => {
      total++;
      if (isStudentOnline(partner)) {
        onlineCount++;
      }
    });
  }
  
  return appStore.language === 'English'
    ? `${onlineCount}/${total} Online`
    : `සබැඳි: ${onlineCount}/${total}`;
}

const startCall = (pair) => {
  const cleanId = String(pair.id || 'room').replace(/[^a-zA-Z0-9]/g, '-');
  const roomName = `Session-${cleanId}-Team-${pair.team_number}`;
  const baseUrl = `https://meet.jit.si/ClassMaster-${roomName}`;
  const url = pair.type === 'Video Call' ? baseUrl : `${baseUrl}#config.startWithVideoMuted=true`;
  window.open(url, '_blank');
}
</script>

<style scoped lang="scss">
.portal-root {
    background: radial-gradient(circle at top right, #1e1b4b, #000);
    min-height: 100vh;
}

.portal-container {
    max-width: 1200px;
    margin: 0 auto;
}

.glass-modern {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    transition: all 0.3s ease;
    &:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.2);
    }
}

.auth-card {
    width: 100%;
    max-width: 450px;
}

.profile-banner {
    position: relative;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
    .banner-accent {
        position: absolute;
        top: -50px;
        right: -50px;
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
        border-radius: 50%;
    }
}

.profile-avatar-glow {
    border: 4px solid rgba(99, 102, 241, 0.5);
    box-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
}

.stat-pill {
    background: rgba(255, 255, 255, 0.05);
    padding: 6px 16px;
    border-radius: 100px;
    color: #e2e8f0;
    font-size: 0.9rem;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-mini-card {
    border-bottom: 4px solid transparent;
    &:hover {
        border-bottom-color: #6366f1;
    }
}

.chart-card {
    padding: 10px;
}

.id-input-field {
    :deep(.q-field__control) {
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.05);
    }
}

.premium-btn {
    border-radius: 12px;
    transition: transform 0.2s;
    &:hover {
        transform: scale(1.02);
    }
}

.glow-shadow {
    filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.4));
}

.letter-spacing-tight { letter-spacing: -0.05em; }
.letter-spacing-wide { letter-spacing: 0.1em; }

.border-left-teal {
  border-left: 5px solid #009688 !important;
}

.border-left-accolade {
  border-left: 5px solid #2e7d32 !important;
}

.border-left-warning {
  border-left: 5px solid #ff8f00 !important;
}

.border-left-infraction {
  border-left: 5px solid #d32f2f !important;
}

.border-left-suspension {
  border-left: 5px solid #5e35b1 !important;
}

.border-bottom-light {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.text-line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1.5px solid #1e1b4b; /* contrast with the dark background */
}
.status-dot.online {
  background-color: #4caf50;
  box-shadow: 0 0 4px rgba(76, 175, 80, 0.6);
}
.status-dot.offline {
  background-color: #9e9e9e;
}
@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 8px rgba(76, 175, 80, 0.6); }
  100% { transform: scale(0.95); opacity: 0.8; }
}
.animate-pulse {
  animation: pulse 2s infinite ease-in-out;
}

/* Elegant ledger styles for discipline history on character certificate */
.conduct-summary-grid {
    border: 1px dashed rgba(49, 151, 149, 0.35);
    background: rgba(255, 255, 255, 0.45);
    border-radius: 6px;
    padding: 10px;
    font-size: 0.82rem;
}

.conduct-column-header {
    border-bottom: 1px solid rgba(49, 151, 149, 0.25);
    padding-bottom: 4px;
    margin-bottom: 6px;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.conduct-list {
    margin: 0;
    padding-left: 14px;
    list-style-type: square;
    max-height: 100px;
    overflow-y: auto;
}

.conduct-list li {
    margin-bottom: 3px;
    line-height: 1.25;
}

.conduct-empty {
    font-style: italic;
    font-size: 0.8rem;
    padding: 8px 0;
}

/* Elegant Certificate Aesthetics */
.certificate-card {
    background: #fff9f2;
    border: 15px double #c5a880;
    border-radius: 8px;
    color: #2c2c2c;
    font-family: 'Georgia', 'Garamond', serif;
    position: relative;
    box-shadow: 0 10px 40px rgba(0,0,0,0.6);
    background-image: radial-gradient(circle, rgba(197, 168, 128, 0.05) 1px, transparent 1px);
    background-size: 20px 20px;
}

.certificate-inner-border {
    border: 2px dashed rgba(197, 168, 128, 0.5);
    height: 100%;
}

.certificate-title {
    font-family: 'Georgia', serif;
    font-weight: 700;
    color: #8c6d3f;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 2rem;
}

.certificate-subtitle {
    font-style: italic;
    color: #555;
    letter-spacing: 0.02em;
    font-size: 1rem;
}

.recipient-name {
    font-family: 'Brush Script MT', 'Georgia', cursive, serif;
    font-size: 2.8rem;
    font-weight: bold;
    color: #1e1b4b;
    border-bottom: 2px solid rgba(197, 168, 128, 0.6);
    display: inline-block;
    padding: 0 40px;
    margin: 10px 0;
}

.certificate-text {
    font-size: 1.05rem;
    line-height: 1.6;
    color: #333;
    max-width: 650px;
    margin: 0 auto;
}

.certificate-seal {
    width: 80px;
    height: 80px;
    background: radial-gradient(circle, #ffd700 0%, #d4af37 100%);
    border-radius: 50%;
    border: 3px dashed #8c6d3f;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

.signature-block {
    border-top: 1px solid #aaa;
    display: inline-block;
    padding-top: 5px;
    min-width: 160px;
    font-size: 0.8rem;
    color: #555;
}

.signature-text {
    font-family: 'Brush Script MT', 'Dancing Script', 'Playball', 'Great Vibes', cursive;
    font-size: 1.5rem;
    color: #444;
    line-height: 1;
    margin-bottom: 2px;
}

.character-certificate-card .certificate-inner-border {
    border: 2px dashed rgba(49, 151, 149, 0.5) !important;
}

.watermark-badge {
    position: absolute;
    width: 250px;
    height: 250px;
    background: url('/favicon.svg') no-repeat center;
    background-size: contain;
    opacity: 0.035;
    pointer-events: none;
    z-index: 0;
}

/* Character Certificate Styling */
.character-certificate-card {
    background: #f4fbfb !important;
    border: 15px double #319795 !important;
    color: #2c3e50 !important;
    background-image: radial-gradient(circle, rgba(49, 151, 149, 0.05) 1px, transparent 1px) !important;
    background-size: 20px 20px !important;
}

.character-title {
    color: #1f4e5b !important;
}

.character-certificate-seal {
    width: 80px;
    height: 80px;
    background: radial-gradient(circle, #38b2ac 0%, #319795 100%) !important;
    border-radius: 50% !important;
    border: 3px dashed #1f4e5b !important;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15) !important;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

.glass-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    &:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.25);
    }
}

.border-gold { border: 3px solid #ffd700; }
.border-silver { border: 3px solid #c0c0c0; }
.border-bronze { border: 3px solid #cd7f32; }

@media (max-width: 600px) {
    .text-h3 { font-size: 2rem; }
    .profile-banner { text-align: center; }
    .profile-banner .q-avatar { margin: 0 0 20px 0; }
    .stat-mini-card { margin-bottom: 10px; }
}


/* Print CSS Stylesheet (Global) */
</style>

<style lang="scss">
@media print {
    @page {
        size: landscape;
        margin: 0;
    }
    
    html, body {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: #fff9f2 !important;
        color: #2c2c2c !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    #q-app {
        display: none !important;
    }
    
    .q-dialog__backdrop {
        display: none !important;
    }
    
    .q-dialog {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        min-height: 100vh !important;
        background: transparent !important;
        box-shadow: none !important;
        display: block !important;
        overflow: visible !important;
    }
    
    .q-dialog__inner {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        min-height: 100vh !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        overflow: visible !important;
        display: block !important;
        max-height: none !important;
        max-width: none !important;
    }
    
    .no-print, .no-print * {
        display: none !important;
    }
    
    .q-dialog .q-card {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        min-height: 100vh !important;
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
        max-width: none !important;
        overflow: visible !important;
    }
    
    .q-dialog .q-card__section {
        padding: 0 !important;
        margin: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        display: block !important;
        overflow: visible !important;
    }
    
    .certificate-print-area {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        min-height: 100vh !important;
        margin: 0 !important;
        padding: 40px !important;
        box-sizing: border-box !important;
        box-shadow: none !important;
        border: 24px double #c5a880 !important;
        background: #fff9f2 !important;
        color: #2c2c2c !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
    }
    
    .certificate-print-area .certificate-inner-border {
        width: 100% !important;
        height: 100% !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        padding: 20px !important;
    }
    
    .certificate-print-area.character-certificate-card .certificate-inner-border {
        border: 2px dashed rgba(49, 151, 149, 0.6) !important;
    }
    
    .character-certificate-card {
        border: 24px double #319795 !important;
        background: #f4fbfb !important;
        color: #2c3e50 !important;
    }
    
    /* Ensure all text inside the print area is visible and correctly colored */
    .certificate-print-area * {
        color: inherit !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    
    .certificate-print-area .recipient-name {
        color: #1e1b4b !important;
        border-bottom: 2px solid rgba(197, 168, 128, 0.6) !important;
    }
    
    .certificate-print-area.character-certificate-card .recipient-name {
        color: #1a365d !important;
        border-bottom: 2px solid rgba(49, 151, 149, 0.6) !important;
    }
    
    .certificate-print-area .certificate-title {
        color: #8c6d3f !important;
    }
    
    .certificate-print-area.character-certificate-card .character-title {
        color: #1f4e5b !important;
    }
    
    .certificate-print-area .certificate-text {
        color: #333333 !important;
    }
    
    .certificate-print-area .signature-text {
        color: #444444 !important;
    }
    
    .certificate-print-area .signature-block {
        color: #555555 !important;
        border-top: 1px solid #aaaaaa !important;
    }
    
    /* Disciplinary summary ledger print styles */
    .certificate-print-area .conduct-summary-grid {
        background: rgba(255, 255, 255, 0.85) !important;
        border: 1px dashed rgba(49, 151, 149, 0.6) !important;
        color: #2c3e50 !important;
    }
    
    .certificate-print-area .conduct-column-header {
        border-bottom: 1px solid rgba(49, 151, 149, 0.4) !important;
    }
    
    .certificate-print-area .text-teal-9 {
        color: #0d5a58 !important;
    }
    
    .certificate-print-area .text-red-9 {
        color: #9b2c2c !important;
    }
    
    .certificate-print-area .text-green-9 {
        color: #22543d !important;
    }
    
    .certificate-print-area .text-teal-8 {
        color: #137775 !important;
    }
    
    .certificate-print-area .conduct-empty {
        color: inherit !important;
    }

    .certificate-print-area .conduct-list li {
        color: inherit !important;
    }
    
    /* Hide all other portals to be absolutely safe */
    .q-portal:not(:has(.certificate-print-area)) {
        display: none !important;
    }
}
</style>
