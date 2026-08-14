<template>
  <q-page class="bg-black text-white">
    
    <!-- Hero Section with Integrated Single-Page Auth -->
    <section id="hero" class="relative-position section-padding overflow-hidden flex flex-center" style="min-height: 100vh;">
      <!-- Background Elements -->
      <div class="absolute-full">
        <q-img 
          src="~assets/hero_education_dark_1767203133564.png" 
          class="fit" 
          style="opacity: 0.25; filter: grayscale(100%) brightness(0.6);"
        />
        <div class="absolute-full" style="background: radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, #000 95%);"></div>
      </div>

      <div class="container-xl relative-position z-top q-py-xl" style="width: 100%;">
        <div class="row items-center q-col-gutter-xl">
          
          <!-- Left Column: High Impact Branding & Hero Copy -->
          <div class="col-xs-12 col-lg-7 text-center text-lg-left">
            <div class="hero-content">
              <q-badge outline color="white" label="SYSTEM V3.1 INSTANT ACCESS" class="q-mb-lg q-px-md q-py-xs letter-spacing-wide opacity-0 hero-badge" rounded />
              
              <h1 class="text-h1 q-mb-lg text-weight-bolder text-gradient letter-spacing-tight hero-title opacity-0" style="line-height: 1.05;">
                The Future of<br>
                Tuition Management.
              </h1>
              
              <p class="text-h6 q-mb-xl text-grey-4 text-weight-light hero-subtitle opacity-0" style="max-width: 620px; line-height: 1.6;">
                A high-performance ecosystem engineered to streamline, scale, and modernize tuition institutes globally. Instant enrollment, biometric QR sync, & cloud financial ledger.
              </p>
              
              <div class="row q-gutter-md justify-center justify-lg-start hero-btns opacity-0 q-mb-xl">
                <q-btn 
                  size="lg" 
                  color="white" 
                  text-color="black" 
                  label="Instant Registration" 
                  @click="switchAuthTab('register')"
                  no-caps 
                  unelevated
                  rounded
                  padding="14px 40px"
                  class="text-weight-bold hover-glow"
                />
                <q-btn 
                  size="lg" 
                  outline 
                  color="white" 
                  label="Sign In" 
                  @click="switchAuthTab('login')"
                  no-caps 
                  rounded
                  padding="14px 40px"
                  class="glass-button"
                />
                <q-btn 
                  size="lg" 
                  flat 
                  color="grey-4" 
                  label="Explore All Plans" 
                  @click="scrollToSection('pricing')"
                  no-caps 
                  icon-right="arrow_downward"
                />
              </div>

              <!-- Quick Highlights -->
              <div class="row q-col-gutter-md justify-center justify-lg-start hero-highlights opacity-0">
                <div class="col-auto row items-center text-grey-4">
                  <q-icon name="check_circle" color="yellow-6" class="q-mr-xs" size="18px" />
                  <span>7-Day Free Trial</span>
                </div>
                <div class="col-auto row items-center text-grey-4">
                  <q-icon name="check_circle" color="yellow-6" class="q-mr-xs" size="18px" />
                  <span>4 Flexible Tiers</span>
                </div>
                <div class="col-auto row items-center text-grey-4">
                  <q-icon name="check_circle" color="yellow-6" class="q-mr-xs" size="18px" />
                  <span>24/7 Dedicated Support</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Embedded All-in-One Auth Card -->
          <div class="col-xs-12 col-lg-5" id="auth-section">
            <div class="glass-card auth-card rounded-borders shadow-24 overflow-hidden relative-position">
              
              <!-- Tab Header -->
              <div class="bg-dark-tabs border-bottom border-dark">
                <q-tabs
                  v-model="authTab"
                  dense
                  class="text-grey-5"
                  active-color="white"
                  indicator-color="white"
                  align="justify"
                  narrow-indicator
                >
                  <q-tab name="register" label="Create Account" icon="person_add" no-caps class="q-py-md text-weight-bold" />
                  <q-tab name="login" label="Sign In" icon="login" no-caps class="q-py-md text-weight-bold" />
                </q-tabs>
              </div>

              <q-tab-panels v-model="authTab" animated class="bg-transparent text-white">
                
                <!-- REGISTER TAB PANEL -->
                <q-tab-panel name="register" class="q-pa-lg">
                  <div class="text-center q-mb-md">
                    <h3 class="text-h5 text-weight-bold q-mb-xs">Join ClassMaster</h3>
                    <p class="text-caption text-grey-5">Select your package tier & start your 7-day trial now.</p>
                  </div>

                  <q-form @submit="onRegisterSubmit" class="q-gutter-y-md">
                    
                    <q-input 
                      v-model="regEmail" 
                      label="Email Address" 
                      dark 
                      outlined 
                      dense
                      class="custom-input"
                      :rules="[ val => val && val.length > 0 || 'Please type your email']"
                    >
                      <template v-slot:prepend>
                        <q-icon name="email" color="grey-7" size="18px" />
                      </template>
                    </q-input>

                    <div class="row q-col-gutter-sm">
                      <div class="col-12 col-sm-6">
                        <q-input 
                          v-model="regPassword" 
                          label="Password" 
                          type="password" 
                          dark 
                          outlined 
                          dense
                          class="custom-input"
                          :rules="[ 
                            val => val && val.length > 0 || 'Type password',
                            val => val.length >= 6 || 'Min 6 characters'
                          ]"
                        >
                          <template v-slot:prepend>
                            <q-icon name="lock" color="grey-7" size="18px" />
                          </template>
                        </q-input>
                      </div>
                      <div class="col-12 col-sm-6">
                        <q-input 
                          v-model="regConfirmPassword" 
                          label="Confirm Password" 
                          type="password" 
                          dark 
                          outlined 
                          dense
                          class="custom-input"
                          :rules="[ 
                            val => val && val === regPassword || 'Passwords mismatch'
                          ]"
                        >
                          <template v-slot:prepend>
                            <q-icon name="lock_clock" color="grey-7" size="18px" />
                          </template>
                        </q-input>
                      </div>
                    </div>

                    <q-input 
                      v-model="regWhatsapp" 
                      label="WhatsApp Number" 
                      dark 
                      outlined 
                      dense
                      placeholder="e.g. 0702838364"
                      class="custom-input"
                      :rules="[ 
                        val => val && val.replace(/\D/g, '').length >= 9 || (appStore.language === 'English' ? 'Please enter a valid phone number' : 'කරුණාකර වලංගු දුරකථන අංකයක් ඇතුළත් කරන්න')
                      ]"
                    >
                      <template v-slot:prepend>
                        <q-icon name="phone" color="grey-7" size="18px" />
                      </template>
                    </q-input>

                    <!-- All 4 Package Selector Grid -->
                    <div class="q-pa-md rounded-borders" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);">
                      <div class="row items-center justify-between q-mb-sm">
                        <div class="row items-center">
                          <q-icon name="stars" color="yellow-6" size="20px" class="q-mr-xs" />
                          <span class="text-subtitle2 text-weight-bold text-white">Select Package</span>
                        </div>
                        <q-badge color="indigo-10" label="All Features" />
                      </div>

                      <!-- 4 Tier Selector Buttons -->
                      <div class="row q-col-gutter-xs q-mb-sm">
                        <div v-for="pkg in allPackages" :key="pkg.id" class="col-6">
                          <div 
                            class="q-pa-xs rounded-borders text-center cursor-pointer transition-all border-grey"
                            :class="selectedPackageId === pkg.id ? 'bg-indigo-10 border-indigo' : 'bg-grey-10'"
                            @click="selectedPackageId = pkg.id"
                          >
                            <div class="text-caption text-weight-bold text-white" style="font-size: 0.75rem;">{{ pkg.name }}</div>
                            <div class="text-subtitle2 text-weight-bolder text-yellow-5" style="font-size: 0.85rem;">
                              LKR {{ getPackageDisplayPrice(pkg).toLocaleString() }}
                            </div>
                            <div class="text-caption text-grey-5" style="font-size: 0.65rem;">
                              {{ activeBillingCycle === 'lifetime' ? 'Lifetime' : (activeBillingCycle === 'annual' ? '/yr' : '/mo') }}
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Bank Details Info -->
                      <div class="q-pa-xs rounded-borders bg-black border-dark text-caption">
                        <div class="row items-center justify-between text-grey-4 q-px-xs">
                          <span>Bank: <strong class="text-white">{{ adminDetails.bank_name }}</strong></span>
                          <span>Acc: <strong class="text-yellow-5">{{ adminDetails.account_number }}</strong></span>
                        </div>
                        <div class="text-grey-4 q-px-xs q-mt-xs">
                          Holder: <strong class="text-white">{{ adminDetails.account_holder_name }}</strong>
                        </div>
                        <div class="text-grey-5 q-px-xs q-mt-xs flex items-center">
                          <q-icon name="info" color="grey-4" size="14px" class="q-mr-xs" />
                          Send slip & email to <strong>0702838364</strong> via WhatsApp.
                        </div>
                      </div>
                    </div>

                    <!-- Cloudflare Turnstile -->
                    <div class="flex flex-center">
                      <VueTurnstile site-key="0x4AAAAAADHUUksPvPEHMfdp" v-model="turnstileToken" />
                    </div>

                    <q-btn 
                      type="submit"
                      label="Complete Registration" 
                      color="white" 
                      text-color="black" 
                      rounded 
                      unelevated 
                      no-caps 
                      size="lg" 
                      class="full-width text-weight-bold hover-glow" 
                      :loading="regLoading"
                    />
                  </q-form>
                </q-tab-panel>

                <!-- LOGIN TAB PANEL -->
                <q-tab-panel name="login" class="q-pa-lg">
                  <div class="text-center q-mb-md">
                    <h3 class="text-h5 text-weight-bold q-mb-xs">Welcome Back</h3>
                    <p class="text-caption text-grey-5">Sign in to access your tuition dashboard.</p>
                  </div>

                  <div v-if="loginErrorMessage" class="bg-red-9 text-white q-pa-sm rounded-borders text-center q-mb-md flex flex-center border-red text-caption">
                    <q-icon name="error" class="q-mr-xs" /> {{ loginErrorMessage }}
                  </div>

                  <q-form @submit="onLoginSubmit" class="q-gutter-y-md">
                    
                    <q-input 
                      v-model="loginEmail" 
                      label="Email Address" 
                      dark 
                      outlined 
                      dense
                      class="custom-input"
                      :rules="[ val => val && val.length > 0 || 'Please type your email']"
                    >
                      <template v-slot:prepend>
                        <q-icon name="email" color="grey-7" size="18px" />
                      </template>
                    </q-input>

                    <q-input 
                      v-model="loginPassword" 
                      label="Password" 
                      type="password" 
                      dark 
                      outlined 
                      dense
                      class="custom-input"
                      :rules="[ val => val && val.length > 0 || 'Please type your password']"
                    >
                      <template v-slot:prepend>
                        <q-icon name="lock" color="grey-7" size="18px" />
                      </template>
                    </q-input>

                    <div class="row items-center justify-between">
                      <q-checkbox v-model="rememberMe" label="Remember me" dark color="white" dense class="text-caption text-grey-4" />
                    </div>

                    <!-- Cloudflare Turnstile -->
                    <div class="flex flex-center">
                      <VueTurnstile site-key="0x4AAAAAADHUUksPvPEHMfdp" v-model="turnstileToken" />
                    </div>

                    <q-btn 
                      type="submit"
                      label="Sign In to Dashboard" 
                      color="white" 
                      text-color="black" 
                      rounded 
                      unelevated 
                      no-caps 
                      size="lg" 
                      class="full-width text-weight-bold hover-glow" 
                      style="height: 50px;"
                      :loading="loginLoading"
                    />
                  </q-form>

                  <div class="text-center q-mt-lg">
                    <q-btn flat color="indigo-2" label="Switch to Student Portal" to="/student-portal" no-caps icon="school" class="text-weight-bold text-caption" />
                  </div>
                </q-tab-panel>

              </q-tab-panels>
            </div>
          </div>

        </div>
      </div>
      
      <!-- Scroll Down Indicator -->
      <div class="absolute-bottom text-center q-pb-lg scroll-indicator opacity-0">
        <div class="text-caption text-grey-6 q-mb-xs letter-spacing-widest">EXPLORE PLATFORM</div>
        <q-icon name="south" size="18px" color="grey-6" />
      </div>
    </section>

    <!-- Student Portal Quick Access Banner -->
    <div class="bg-indigo-10 q-py-lg border-top border-bottom border-dark">
      <div class="container-xl row items-center justify-between q-px-md">
        <div class="row items-center q-gutter-md q-mb-md q-mb-md-none">
          <q-avatar size="44px" color="white" text-color="indigo-10" icon="school" />
          <div>
            <div class="text-h6 text-white text-weight-bold">Are you a Student?</div>
            <div class="text-indigo-2 text-body2">Access your class materials, exam results, and attendance records directly.</div>
          </div>
        </div>
        <q-btn 
          color="white" 
          text-color="indigo-10" 
          label="Launch Student Portal" 
          to="/student-portal" 
          no-caps 
          rounded 
          unelevated 
          class="text-weight-bold q-px-xl shadow-4"
        />
      </div>
    </div>

    <!-- Live Platform Statistics -->
    <div class="bg-black border-dark border-bottom">
      <div class="row justify-evenly items-center text-center container-xl q-py-xl">
        <div class="col-xs-12 col-md-4 q-mb-lg q-mb-md-none">
          <div class="text-h2 text-weight-bolder text-white">500<span class="text-yellow-6">+</span></div>
          <div class="text-caption text-grey-5 text-uppercase letter-spacing-wide q-mt-xs">Active Tuition Institutes</div>
        </div>
        <div class="col-xs-12 col-md-4 q-mb-lg q-mb-md-none">
          <div class="text-h2 text-weight-bolder text-white">10<span class="text-indigo-4">k+</span></div>
          <div class="text-caption text-grey-5 text-uppercase letter-spacing-wide q-mt-xs">Enrolled Students</div>
        </div>
        <div class="col-xs-12 col-md-4">
          <div class="text-h2 text-weight-bolder text-white">99<span class="text-green-5">%</span></div>
          <div class="text-caption text-grey-5 text-uppercase letter-spacing-wide q-mt-xs">System Uptime & Satisfaction</div>
        </div>
      </div>
    </div>

    <!-- Dashboard Preview Showcase -->
    <section id="about" class="section-padding">
      <div class="container-xl">
        <div class="row items-center q-col-gutter-xl">
          <div class="col-xs-12 col-md-5">
            <q-intersection transition="slide-up">
              <div class="text-overline text-indigo-3 q-mb-sm letter-spacing-wide">CENTRAL CONTROL CENTER</div>
              <h2 class="text-h2 q-mb-lg text-weight-bolder letter-spacing-tight">Simplicity Meets<br>Powerful Analytics.</h2>
              <p class="text-body1 text-grey-4 q-mb-xl" style="line-height: 1.7;">
                Experience the clarity of a centralized platform. Monitor attendance trends, fee collection status, tutor pairing, and student metrics in real-time.
              </p>
              
              <q-list dense padding class="q-gutter-y-md">
                <q-item v-for="point in [
                  'Automated Digital Invoicing & Tax Ledger',
                  'QR & Biometric Attendance Sync Gateway',
                  'SMS & WhatsApp Notification Integration',
                  'Role-based Multi-Staff Security Access'
                ]" :key="point" class="q-px-none">
                  <q-item-section avatar min-width="24px">
                    <q-icon name="check_circle" color="yellow-6" size="20px" />
                  </q-item-section>
                  <q-item-section class="text-grey-3 text-weight-medium">{{ point }}</q-item-section>
                </q-item>
              </q-list>
            </q-intersection>
          </div>
          
          <div class="col-xs-12 col-md-7">
            <q-intersection transition="fade">
              <div class="relative-position">
                <div class="absolute-full bg-indigo opacity-10 blur-3xl" style="transform: scale(0.8); border-radius: 40px;"></div>
                <q-img 
                  src="~assets/dashboard_mockup_dark_1767203150947.png" 
                  class="rounded-borders shadow-24 hover-glow relative-position z-top"
                  style="border: 1px solid rgba(255,255,255,0.15);"
                />
              </div>
            </q-intersection>
          </div>
        </div>
      </div>
    </section>

    <!-- Core Modules Grid -->
    <section id="features" class="section-padding bg-dark-page">
      <div class="container-xl text-center">
        <q-badge outline color="white" label="COMPLETE ENGINE" class="q-mb-md q-px-md q-py-xs letter-spacing-wide" rounded />
        <h2 class="text-h2 q-mb-sm text-weight-bolder letter-spacing-tight">Core Modules</h2>
        <p class="text-grey-5 text-h6 q-mb-xl opacity-70">Everything you need to run your academy seamlessly.</p>

        <div class="row q-col-gutter-lg text-left">
          <div class="col-xs-12 col-sm-6 col-md-4" v-for="(feature, index) in features" :key="index">
            <q-intersection transition="fade" :delay="index * 100">
              <div class="glass-card q-pa-xl rounded-borders h-full relative-position overflow-hidden hover-card">
                <div class="icon-container q-mb-lg flex flex-center">
                  <q-icon :name="feature.icon" size="30px" color="white" />
                </div>
                <div class="text-h5 q-mb-md text-weight-bold letter-spacing-tight">{{ feature.title }}</div>
                <p class="text-grey-5 text-body2" style="line-height: 1.7;">{{ feature.description }}</p>
              </div>
            </q-intersection>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section id="testimonials" class="section-padding bg-black border-top border-bottom border-dark">
      <div class="container-xl text-center">
         <h2 class="text-h2 q-mb-xl text-weight-bolder letter-spacing-tight">Trusted Globally</h2>
         <q-carousel
            v-model="slide"
            transition-prev="fade"
            transition-next="fade"
            swipeable
            animated
            infinite
            autoplay
            control-color="white"
            navigation
            padding
            arrows
            class="bg-transparent testimonial-carousel"
          >
            <q-carousel-slide name="1" class="column no-wrap flex-center q-px-md">
              <q-avatar size="80px" class="q-mb-md shadow-10">
                <img src="https://cdn.quasar.dev/img/avatar1.jpg">
              </q-avatar>
              <div class="testimonial-text text-white q-mb-md italic">"The efficiency boost we've seen since switching to ClassMaster is unparalleled. It's the gold standard."</div>
              <div class="text-overline text-yellow-5">— Mr. Perera, Maths Academy</div>
            </q-carousel-slide>
            
            <q-carousel-slide name="2" class="column no-wrap flex-center q-px-md">
              <q-avatar size="80px" class="q-mb-md shadow-10">
                 <img src="https://cdn.quasar.dev/img/avatar2.jpg">
              </q-avatar>
              <div class="testimonial-text text-white q-mb-md italic">"Automated attendance via QR scan has transformed our entry protocol. Simple and effective."</div>
              <div class="text-overline text-yellow-5">— Ms. Silva, Science Zone</div>
            </q-carousel-slide>
            
            <q-carousel-slide name="3" class="column no-wrap flex-center q-px-md">
              <q-avatar size="80px" class="q-mb-md shadow-10">
                 <img src="https://cdn.quasar.dev/img/avatar3.jpg">
              </q-avatar>
              <div class="testimonial-text text-white q-mb-md italic">"The financial reporting and automated invoicing saved us hours of manual work every week. Highly recommended."</div>
              <div class="text-overline text-yellow-5">— Mr. Kumara, English Hub</div>
            </q-carousel-slide>
            
            <q-carousel-slide name="4" class="column no-wrap flex-center q-px-md">
              <q-avatar size="80px" class="q-mb-md shadow-10">
                 <img src="https://cdn.quasar.dev/img/avatar4.jpg">
              </q-avatar>
              <div class="testimonial-text text-white q-mb-md italic">"The white-label portal gives our academy a professional edge. Students love the real-time tracking."</div>
              <div class="text-overline text-yellow-5">— Dr. Fernando, Wisdom Institute</div>
            </q-carousel-slide>
          </q-carousel>
      </div>
    </section>

    <!-- Complete 4-Tier Flexible Pricing Section -->
    <section id="pricing" class="section-padding">
       <div class="container-xl">
          <div class="text-center q-mb-xl">
             <q-badge outline color="white" label="TRANSPARENT PRICING" class="q-mb-md q-px-md q-py-xs letter-spacing-wide" rounded />
             <h2 class="text-h2 text-weight-bolder">Choose Your Perfect Plan</h2>
             <p class="text-grey-5 text-h6 q-mt-xs">Scalable packages designed for individual tutors to enterprise academies.</p>

             <!-- Interactive Billing Cycle Toggle -->
             <div class="row justify-center items-center q-mt-lg">
               <q-btn-toggle
                 v-model="activeBillingCycle"
                 toggle-color="indigo-10"
                 color="grey-10"
                 text-color="grey-4"
                 unelevated
                 rounded
                 class="border-grey q-pa-xs"
                 :options="[
                   { label: 'Monthly', value: 'monthly' },
                   { label: 'Annually (Save 20%)', value: 'annual' },
                   { label: 'Lifetime Access (One-Time)', value: 'lifetime' }
                 ]"
               />
             </div>
          </div>

          <!-- All 4 Package Cards Grid -->
          <div class="row q-col-gutter-lg justify-center items-stretch">
            <div
              v-for="pkg in allPackages"
              :key="pkg.id"
              class="col-12 col-sm-6 col-md-3 flex"
            >
              <div 
                class="glass-card q-pa-lg rounded-borders full-width flex flex-column justify-between relative-position overflow-hidden hover-card"
                :class="{ 'border-indigo shadow-24': pkg.id === 'standard' || pkg.id === 'enterprise' }"
              >
                <!-- Badge Header -->
                <div class="q-mb-md text-center relative-position">
                  <q-badge
                    v-if="pkg.badge"
                    :color="pkg.color"
                    text-color="white"
                    class="q-pa-xs text-weight-bold q-mb-xs"
                  >
                    {{ pkg.badge }}
                  </q-badge>
                  <div class="text-h4 text-weight-bold text-white q-mt-xs">{{ pkg.name }}</div>
                  <div class="text-caption text-indigo-2 font-weight-medium">
                    {{ pkg.student_limit === 999999 ? 'Unlimited Students' : `Up to ${pkg.student_limit} Students` }}
                  </div>
                </div>

                <!-- Price Display -->
                <div class="text-center q-mb-md q-pa-md rounded-borders" style="background: rgba(255,255,255,0.03);">
                  <div class="text-caption text-grey-5">Price (LKR)</div>
                  <div class="text-h3 text-weight-bolder text-white q-my-xs">
                    {{ getPackageDisplayPrice(pkg).toLocaleString() }}
                  </div>
                  <div class="text-caption text-yellow-5 text-weight-bold">
                    {{ activeBillingCycle === 'monthly' ? '/ month' : (activeBillingCycle === 'annual' ? '/ year' : 'One-Time Payment') }}
                  </div>
                </div>

                <!-- Features List -->
                <q-list dense class="q-gutter-y-sm q-mb-lg full-width">
                  <q-item v-for="(feat, fIdx) in pkg.features" :key="fIdx" class="q-px-none">
                    <q-item-section avatar min-width="20px">
                      <q-icon name="check_circle" color="yellow-6" size="16px" />
                    </q-item-section>
                    <q-item-section class="text-grey-3 text-caption">
                      {{ feat }}
                    </q-item-section>
                  </q-item>
                </q-list>

                <!-- Select Button -->
                <q-btn 
                  size="md" 
                  :color="pkg.id === 'standard' || pkg.id === 'enterprise' ? 'white' : 'indigo-10'" 
                  :text-color="pkg.id === 'standard' || pkg.id === 'enterprise' ? 'black' : 'white'" 
                  label="Select This Plan" 
                  @click="selectSpecificPackage(pkg.id)" 
                  no-caps 
                  rounded 
                  class="full-width text-weight-bold hover-glow" 
                />
              </div>
            </div>
          </div>
       </div>
    </section>

    <!-- Final Call to Action -->
    <section class="relative-position section-padding text-center overflow-hidden border-top border-dark">
       <div class="absolute-full">
        <q-img 
          src="~assets/modern_classroom_dark_1767203250448.png" 
          class="fit" 
          style="opacity: 0.15; filter: grayscale(100%);"
        />
        <div class="absolute-full" style="background: radial-gradient(circle at center, transparent, #000 85%);"></div>
      </div>
      
      <div class="container-xl relative-position z-top q-py-xl">
        <h2 class="text-h2 q-mb-lg text-weight-bolder letter-spacing-tight">Ready to Modernize Your Institute?</h2>
        <p class="text-h6 text-grey-4 q-mb-xl opacity-80" style="max-width: 600px; margin-left: auto; margin-right: auto;">Join over 500+ academies scaling their student performance and financial management with ClassMaster.</p>
        <q-btn 
          size="lg" 
          color="white" 
          text-color="black" 
          label="Get Started Now" 
          @click="switchAuthTab('register')"
          no-caps 
          rounded
          padding="16px 56px"
          class="text-weight-bold hover-glow"
        />
      </div>
    </section>

  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { auth } from 'src/api'
import VueTurnstile from 'vue-turnstile'
import { useAppStore } from 'src/store/app'
import gsap from 'gsap'

const props = defineProps({
  initialTab: {
    type: String,
    default: 'register'
  }
})

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const appStore = useAppStore()

const authTab = ref(props.initialTab || route.query.tab || 'register')
const slide = ref('1')

// Pricing State
const activeBillingCycle = ref('monthly')
const selectedPackageId = ref('enterprise')

// All 4 Packages Definition
const allPackages = ref([
  {
    id: 'starter',
    name: 'Starter Pack',
    badge: 'Essential',
    color: 'blue-7',
    student_limit: 50,
    prices: { monthly: 1500, annual: 14400, lifetime: 35000 },
    features: [
      'Up to 50 Active Students',
      'Up to 2 Active Classes',
      '1 Staff Member',
      'Dashboard & Student Management',
      'Class Scheduling & Attendance',
      'Student QR Scanner'
    ]
  },
  {
    id: 'standard',
    name: 'Standard Pack',
    badge: 'Most Popular',
    color: 'indigo-10',
    student_limit: 250,
    prices: { monthly: 3500, annual: 33600, lifetime: 75000 },
    features: [
      'Up to 250 Active Students',
      'Up to 10 Active Classes',
      'Up to 3 Staff Members',
      'Tutes & Study Materials',
      'Exams & Marks System',
      'Fees Collection & Receipts'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    badge: 'Advanced',
    color: 'purple-8',
    student_limit: 1000,
    prices: { monthly: 7500, annual: 72000, lifetime: 150000 },
    features: [
      'Up to 1,000 Active Students',
      'Up to 30 Active Classes',
      'Up to 10 Staff Members',
      'SMS Gateway & Direct Messaging',
      'Staff Roles & Discipline Engine',
      'Exam Analytics & Certificates'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    badge: 'Ultimate Deal',
    color: 'amber-9',
    student_limit: 999999,
    prices: { monthly: 15000, annual: 144000, lifetime: 130000 },
    features: [
      'Unlimited Active Students',
      'Unlimited Classes & Tutors',
      'Unlimited Staff Members',
      '24/7 Dedicated WhatsApp Support',
      'Custom Card Branding & Themes',
      'Bulk CSV/Excel Data Exports'
    ]
  }
])

// Registration Form State
const regEmail = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')
const regWhatsapp = ref('')
const regLoading = ref(false)

// Login State
const loginEmail = ref('')
const loginPassword = ref('')
const rememberMe = ref(false)
const loginLoading = ref(false)
const loginErrorMessage = ref('')

const turnstileToken = ref('')

const adminDetails = ref({
  bank_name: 'Bank of Ceylon (BOC)',
  account_number: '86019560',
  account_holder_name: 'B.L. Ruwan Manjula'
})

onMounted(() => {
  // Sync tab from query if present
  if (route.query.tab) {
    authTab.value = route.query.tab
  }

  // Load remembered email
  const savedEmail = localStorage.getItem('remembered_email')
  if (savedEmail) {
    loginEmail.value = savedEmail
    rememberMe.value = true
  }

  // Listen for header events to switch tab & scroll
  window.addEventListener('switch-auth-tab', (e) => {
    if (e.detail) {
      authTab.value = e.detail
    }
  })

  // GSAP Entrance Animations
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  tl.to('.hero-badge', { y: 0, opacity: 1, duration: 0.6 })
    .to('.hero-title', { y: 0, opacity: 1, duration: 0.8 }, '-=0.4')
    .to('.hero-subtitle', { y: 0, opacity: 1, duration: 0.8 }, '-=0.6')
    .to('.hero-btns', { y: 0, opacity: 1, duration: 0.8 }, '-=0.6')
    .to('.hero-highlights', { y: 0, opacity: 1, duration: 0.6 }, '-=0.4')
    .to('.scroll-indicator', { y: 0, opacity: 1, duration: 0.8 }, '-=0.4')

  gsap.to('.scroll-indicator', {
    y: 10,
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut'
  })
})

watch(() => route.query.tab, (newTab) => {
  if (newTab) {
    authTab.value = newTab
  }
})

const getPackageDisplayPrice = (pkg) => {
  if (!pkg || !pkg.prices) return 0
  return pkg.prices[activeBillingCycle.value] || pkg.prices.monthly
}

const selectSpecificPackage = (pkgId) => {
  selectedPackageId.value = pkgId
  switchAuthTab('register')
}

const switchAuthTab = (tab) => {
  authTab.value = tab
  scrollToSection('auth-section')
}

const scrollToSection = (sectionId) => {
  const el = document.getElementById(sectionId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

// Registration Submit Handler
const onRegisterSubmit = async () => {
  if (!turnstileToken.value) {
    $q.notify({
      type: 'warning',
      message: 'Please complete the security check',
      position: 'top'
    })
    return
  }

  regLoading.value = true
  
  try {
    await auth.register(regEmail.value, regPassword.value, regWhatsapp.value, turnstileToken.value)

    $q.notify({
      type: 'positive',
      message: 'Registration successful! Welcome to ClassMaster.',
      position: 'top',
      timeout: 5000
    })
    
    router.push('/dashboard')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Error registering',
      position: 'top'
    })
  } finally {
    regLoading.value = false
  }
}

// Login Submit Handler
const onLoginSubmit = async () => {
  if (!turnstileToken.value) {
    loginErrorMessage.value = 'Please complete the security check.'
    return
  }

  loginLoading.value = true
  loginErrorMessage.value = ''
  
  try {
    await auth.login(loginEmail.value, loginPassword.value, turnstileToken.value)

    if (rememberMe.value) {
      localStorage.setItem('remembered_email', loginEmail.value)
    } else {
      localStorage.removeItem('remembered_email')
    }

    $q.notify({
      type: 'positive',
      message: 'Successfully logged in!',
      position: 'top'
    })
    
    router.replace('/dashboard')
  } catch (error) {
    let msg = error.message || 'Error logging in'
    if (msg.includes('Invalid credentials')) {
      msg = 'Incorrect email or password.'
    }
    loginErrorMessage.value = msg
    
    $q.notify({
      type: 'negative',
      message: msg,
      position: 'top',
      timeout: 5000
    })
  } finally {
    loginLoading.value = false
  }
}

const features = [
  {
    title: 'Elite Student Matrix',
    description: 'High-performance student database with precise tracking and behavioral analytics.',
    icon: 'api'
  },
  {
    title: 'Biometric & QR Sync',
    description: 'Automated attendance hooks with real-time parent notification gateways.',
    icon: 'sensors'
  },
  {
    title: 'Financial Ledger',
    description: 'Cloud-synced fee management with automated digital invoicing and tax tracking.',
    icon: 'account_balance'
  },
  {
    title: 'Academic Metrics',
    description: 'Advanced grading systems with automated psychometric performance reports.',
    icon: 'insights'
  },
  {
    title: 'Algorithmic Schedules',
    description: 'Conflict-free classroom scheduling optimized for tutor availability.',
    icon: 'auto_graph'
  },
  {
    title: 'White-Label Portal',
    description: 'Branded experience for parents and students to monitor progress in real-time.',
    icon: 'hub'
  }
]
</script>

<style scoped lang="scss">
.glass-card {
  background: rgba(20, 20, 20, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.auth-card {
  border-radius: 20px;
  background: rgba(12, 12, 12, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
}

.bg-dark-tabs {
  background: rgba(255, 255, 255, 0.04);
}

.custom-input {
  :deep(.q-field__control) {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    
    &:before {
      border-color: rgba(255, 255, 255, 0.12);
    }
    
    &:hover:before {
      border-color: rgba(255, 255, 255, 0.3);
    }
  }
  
  :deep(.q-field__native) {
    color: white;
  }
  
  :deep(.q-field__label) {
    color: #999;
  }
}

.glass-button {
  backdrop-filter: blur(8px);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.15);
  transition: all 0.3s ease;
  &:hover {
    background: rgba(255,255,255,0.12);
    transform: translateY(-2px);
  }
}

.hover-glow {
  transition: all 0.3s ease;
  &:hover {
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.35);
    transform: translateY(-2px);
  }
}

.hover-card {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  &:hover {
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-4px);
  }
}

.icon-container {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
}

.border-indigo {
  border: 1px solid rgba(99, 102, 241, 0.6) !important;
  box-shadow: 0 0 25px rgba(99, 102, 241, 0.25);
}

.border-grey {
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.border-red {
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.blur-3xl {
  filter: blur(64px);
}

.opacity-0 {
  opacity: 0;
}

.hero-badge, .hero-title, .hero-subtitle, .hero-btns, .hero-highlights, .scroll-indicator {
  transform: translateY(30px);
}

.testimonial-carousel {
  height: 360px;
  @media (min-width: 600px) {
    height: 300px;
  }
}

.testimonial-text {
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 700px;
  @media (min-width: 600px) {
    font-size: 1.4rem;
  }
}

@media (max-width: 991px) {
  .hero-title {
    font-size: 2.8rem !important;
    line-height: 1.1 !important;
  }
}
</style>
