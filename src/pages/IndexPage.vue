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
                  label="Explore Features" 
                  @click="scrollToSection('features')"
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
                  <span>Unlimited Students</span>
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
                    <p class="text-caption text-grey-5">Start your 7-day free trial now. Select your preference below.</p>
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

                    <!-- Payment Plan Selector & Details -->
                    <div class="q-pa-md rounded-borders" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);">
                      <div class="row items-center justify-between q-mb-sm">
                        <div class="row items-center">
                          <q-icon name="payments" color="yellow-6" size="20px" class="q-mr-xs" />
                          <span class="text-subtitle2 text-weight-bold text-white">Select Pricing Plan</span>
                        </div>
                        <q-badge color="indigo-10" label="Special Offer" />
                      </div>

                      <div class="row q-col-gutter-xs q-mb-sm">
                        <div class="col-6">
                          <div 
                            class="q-pa-sm rounded-borders text-center cursor-pointer transition-all"
                            :class="selectedPlan === 'lifetime' ? 'bg-indigo-10 border-indigo' : 'bg-grey-10 border-grey'"
                            @click="selectedPlan = 'lifetime'"
                          >
                            <div class="text-caption text-indigo-2 text-weight-bold">LIFETIME</div>
                            <div class="text-subtitle2 text-weight-bolder text-white">Rs. 130,000</div>
                            <div class="text-caption text-grey-5 text-strike">140,000</div>
                          </div>
                        </div>
                        <div class="col-6">
                          <div 
                            class="q-pa-sm rounded-borders text-center cursor-pointer transition-all"
                            :class="selectedPlan === 'monthly' ? 'bg-indigo-10 border-indigo' : 'bg-grey-10 border-grey'"
                            @click="selectedPlan = 'monthly'"
                          >
                            <div class="text-caption text-yellow-5 text-weight-bold">MONTHLY</div>
                            <div class="text-subtitle2 text-weight-bolder text-yellow-5">Rs. 5,000</div>
                            <div class="text-caption text-grey-5">/ month</div>
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

    <!-- Pricing Section -->
    <section id="pricing" class="section-padding">
       <div class="container-xl">
          <div class="text-center q-mb-xl">
             <q-badge outline color="white" label="FLEXIBLE PRICING" class="q-mb-md q-px-md q-py-xs letter-spacing-wide" rounded />
             <h2 class="text-h2 text-weight-bolder">Choose Your Plan</h2>
             <p class="text-grey-5 text-h6 q-mt-xs">Transparent pricing built for academies of all sizes.</p>
          </div>

          <div class="row q-col-gutter-xl justify-center">
            <!-- Lifetime Plan Card -->
            <div class="col-xs-12 col-sm-6 col-md-5">
              <div class="glass-card q-pa-xl rounded-borders h-full flex flex-center flex-column relative-position overflow-hidden border-indigo hover-card">
                <div class="absolute-top-right q-pa-md">
                   <q-badge color="indigo-10" label="LIFETIME ACCESS" class="q-pa-sm text-weight-bold" />
                </div>
                <div class="text-h4 q-mb-md text-weight-bold">Enterprise Lifetime</div>
                <h2 class="text-h2 q-mb-md text-weight-bolder text-white">
                   <span class="text-grey-6 text-strike text-h4 q-mr-sm">Rs. 140,000</span>
                   Rs. 130,000
                </h2>
                <p class="text-grey-4 q-mb-xl text-center">One-time payment for perpetual access. Best for established institutes.</p>
                <q-list dense class="q-gutter-y-md q-mb-xl full-width">
                   <q-item v-for="item in ['All Core Modules Included', 'Unlimited Students & Tutors', 'No Recurring Monthly Bills', 'Free Lifetime Updates & Backup']" :key="item" class="q-px-none">
                      <q-item-section avatar min-width="24px"><q-icon name="check_circle" color="yellow-6" size="20px" /></q-item-section>
                      <q-item-section class="text-grey-3">{{ item }}</q-item-section>
                   </q-item>
                </q-list>
                <q-btn 
                  size="lg" 
                  color="white" 
                  text-color="black" 
                  label="Select Lifetime Deal" 
                  @click="selectPlanAndRegister('lifetime')" 
                  no-caps 
                  rounded 
                  class="full-width text-weight-bold hover-glow" 
                />
              </div>
            </div>

            <!-- Monthly Plan Card -->
            <div class="col-xs-12 col-sm-6 col-md-5">
              <div class="glass-card q-pa-xl rounded-borders h-full flex flex-center flex-column relative-position overflow-hidden hover-card">
                <div class="text-h4 q-mb-md text-weight-bold">Starter Monthly</div>
                <h2 class="text-h2 q-mb-md text-weight-bolder text-yellow-5">Rs. 5,000 <span class="text-h6 text-grey-5">/ mo</span></h2>
                <p class="text-grey-4 q-mb-xl text-center">Low entry cost. Pay as you grow. Ideal for growing academies.</p>
                <q-list dense class="q-gutter-y-md q-mb-xl full-width">
                   <q-item v-for="item in ['All Core Modules Included', 'Monthly Subscription Billing', 'Cancel or Upgrade Anytime', '24/7 Dedicated Support']" :key="item" class="q-px-none">
                      <q-item-section avatar min-width="24px"><q-icon name="check_circle" color="yellow-6" size="20px" /></q-item-section>
                      <q-item-section class="text-grey-3">{{ item }}</q-item-section>
                   </q-item>
                </q-list>
                <q-btn 
                  size="lg" 
                  outline 
                  color="white" 
                  label="Select Monthly Plan" 
                  @click="selectPlanAndRegister('monthly')" 
                  no-caps 
                  rounded 
                  class="full-width text-weight-bold glass-button" 
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

// Registration State
const regEmail = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')
const regWhatsapp = ref('')
const selectedPlan = ref('lifetime')
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

const switchAuthTab = (tab) => {
  authTab.value = tab
  scrollToSection('auth-section')
}

const selectPlanAndRegister = (plan) => {
  selectedPlan.value = plan
  switchAuthTab('register')
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
