<template>
  <q-page class="bg-black text-white">
    
    <!-- Hero Section -->
    <section class="relative-position window-height flex flex-center overflow-hidden">
      <!-- Background Image -->
      <div class="absolute-full">
        <q-img 
          src="~assets/hero_education_dark_1767203133564.png" 
          class="fit" 
          style="opacity: 0.35; filter: grayscale(100%) brightness(0.7);"
        />
        <div class="absolute-full" style="background: radial-gradient(circle at center, transparent 0%, #000 95%);"></div>
      </div>

      <div class="container-xl relative-position z-top text-center text-md-left" style="width: 100%;">
        <div class="row items-center" style="min-height: inherit;">
          <div class="col-12 col-md-8">
            <div class="hero-content">

                <h1 class="text-h1 q-mb-lg text-weight-bolder text-gradient letter-spacing-tight hero-title opacity-0" style="line-height: 0.95;">
                The Future of<br>
                Education.
              </h1>
              <p class="text-h6 q-mb-xl text-grey-5 q-px-md q-px-md-none text-weight-light hero-subtitle opacity-0" style="max-width: 650px; line-height: 1.6;">
                A high-performance ecosystem designed to streamline, scale, and modernize tuition institutes globally.
              </p>
              
              <div class="row q-gutter-md justify-center justify-md-start q-px-md q-px-md-none hero-btns opacity-0">
                <q-btn 
                  size="lg" 
                  color="white" 
                  text-color="black" 
                  label="Get Started" 
                  to="/register"
                  no-caps 
                  unelevated
                  rounded
                  padding="12px 48px"
                  class="text-weight-bold full-width-sm"
                />
                <q-btn 
                  size="lg" 
                  outline 
                  color="white" 
                  label="Sign In" 
                  to="/login"
                  no-caps 
                  rounded
                  padding="12px 48px"
                  class="glass-button full-width-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Scroll Indicator -->
      <div class="absolute-bottom text-center q-pb-xl scroll-indicator opacity-0">
        <div class="text-caption text-grey-7 q-mb-xs">EXPLORE</div>
        <q-icon name="south" size="18px" color="grey-7" />
      </div>
    </section>

    <!-- Student Portal Quick Access -->
    <div class="bg-indigo-10 q-py-lg">
      <div class="container-xl row items-center justify-between q-px-md">
        <div class="row items-center q-gutter-md">
          <q-icon name="school" color="white" size="32px" />
          <div>
            <div class="text-h6 text-white text-weight-bold">Are you a Student?</div>
            <div class="text-indigo-2">Check your results, attendance, and materials instantly.</div>
          </div>
        </div>
        <q-btn 
          color="white" 
          text-color="indigo-10" 
          label="Go to Student Portal" 
          to="/student-portal" 
          no-caps 
          rounded 
          unelevated 
          class="text-weight-bold q-px-xl"
        />
      </div>
    </div>

    <!-- Stats Section -->
    <div class="bg-black border-dark border-top border-bottom">
      <div class="row justify-evenly items-center text-center container-xl q-py-xl">
        <div class="col-xs-12 col-md-3 q-mb-xl q-mb-md-none">
          <div class="text-h2 text-weight-bolder">500<span class="text-grey-7">+</span></div>
          <div class="text-caption text-grey-7 text-uppercase letter-spacing-wide">Institutes</div>
              <div class="q-mb-md">
                <div class="text-caption text-grey-5">Registration Fee (One-time)</div>
                <div class="text-h5 text-weight-bold text-white">
                  <span class="text-grey-6 text-strike q-mr-sm">Rs. 45,000</span> Rs. 40,000
                </div>
              </div>
              <div class="q-mb-md">
                <div class="text-caption text-grey-5">Monthly Subscription Fee</div>
                <div class="text-h5 text-weight-bold text-yellow-6">Rs. 5,000</div>
                <div class="text-caption text-indigo-3">Monthly recurring payment</div>
              </div>
        </div>
        <div class="col-xs-12 col-md-3 q-mb-xl q-mb-md-none">
          <div class="text-h2 text-weight-bolder">10<span class="text-grey-7">k+</span></div>
          <div class="text-caption text-grey-7 text-uppercase letter-spacing-wide">Students</div>
        </div>
        <div class="col-xs-12 col-md-3">
          <div class="text-h2 text-weight-bolder">99<span class="text-grey-7">%</span></div>
          <div class="text-caption text-grey-7 text-uppercase letter-spacing-wide">Satisfaction</div>
        </div>
      </div>
    </div>

    <!-- Dashboard Preview Section -->
    <section id="about" class="section-padding">
      <div class="container-xl">
        <div class="row items-center q-col-gutter-xl">
          <div class="col-xs-12 col-md-5">
            <q-intersection transition="slide-up">
              <div class="text-overline text-white q-mb-sm opacity-50 letter-spacing-wide">THE INTERFACE</div>
              <h2 class="text-h2 q-mb-lg text-weight-bolder letter-spacing-tight">Simplicity Meets<br>Powerful Analytics.</h2>
              <p class="text-body1 text-grey-5 q-mb-xl">
                Experience the clarity of a centralized platform. Monitor attendance trends, financial health, and student engagement in real-time.
              </p>
              
              <q-list dense padding class="q-gutter-y-md">
                <q-item v-for="point in [
                  'Automated Financial Reporting',
                  'QR-Based Attendance Sync',
                  'Integrated Performance Metrics'
                ]" :key="point" class="q-px-none">
                  <q-item-section avatar min-width="24px">
                    <q-icon name="check" color="white" size="20px" />
                  </q-item-section>
                  <q-item-section class="text-grey-4">{{ point }}</q-item-section>
                </q-item>
              </q-list>
            </q-intersection>
          </div>
          
          <div class="col-xs-12 col-md-7">
            <q-intersection transition="fade">
              <div class="relative-position">
                <div class="absolute-full bg-white opacity-5 blur-3xl" style="transform: scale(0.8); border-radius: 40px;"></div>
                <q-img 
                  src="~assets/dashboard_mockup_dark_1767203150947.png" 
                  class="rounded-borders shadow-24 hover-glow relative-position z-top"
                  style="border: 1px solid rgba(255,255,255,0.1);"
                />
              </div>
            </q-intersection>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="section-padding bg-dark-page">
      <div class="container-xl text-center">
        <h2 class="text-h2 q-mb-sm text-weight-bolder letter-spacing-tight">Core Modules</h2>
        <p class="text-grey-5 text-h6 q-mb-xl opacity-70">Everything you need to run your academy seamlessly.</p>

        <div class="row q-col-gutter-lg text-left">
          <div class="col-xs-12 col-sm-6 col-md-4" v-for="(feature, index) in features" :key="index">
            <q-intersection transition="fade" :delay="index * 100">
              <div class="glass-card q-pa-xl rounded-borders h-full relative-position overflow-hidden">
                <div class="icon-container q-mb-lg flex flex-center">
                  <q-icon :name="feature.icon" size="32px" color="white" />
                </div>
                <div class="text-h5 q-mb-md text-weight-bold letter-spacing-tight">{{ feature.title }}</div>
                <p class="text-grey-6 text-body2" style="line-height: 1.7;">{{ feature.description }}</p>
              </div>
            </q-intersection>
          </div>
        </div>
      </div>
    </section>

    
    <section id="testimonials" class="section-padding bg-dark-page">
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
              <q-avatar size="80px" class="q-mb-md">
                <img src="https://cdn.quasar.dev/img/avatar1.jpg">
              </q-avatar>
              <div class="testimonial-text text-white q-mb-md italic">"The efficiency boost we've seen since switching to ClassMaster is unparalleled. It's the gold standard."</div>
              <div class="text-overline text-grey-5">— Mr. Perera, Maths Academy</div>
            </q-carousel-slide>
            
            <q-carousel-slide name="2" class="column no-wrap flex-center q-px-md">
              <q-avatar size="80px" class="q-mb-md">
                 <img src="https://cdn.quasar.dev/img/avatar2.jpg">
              </q-avatar>
              <div class="testimonial-text text-white q-mb-md italic">"Automated attendance via QR scan has transformed our entry protocol. Simple and effective."</div>
              <div class="text-overline text-grey-5">— Ms. Silva, Science Zone</div>
            </q-carousel-slide>
            
            <q-carousel-slide name="3" class="column no-wrap flex-center q-px-md">
              <q-avatar size="80px" class="q-mb-md">
                 <img src="https://cdn.quasar.dev/img/avatar3.jpg">
              </q-avatar>
              <div class="testimonial-text text-white q-mb-md italic">"The financial reporting and automated invoicing saved us hours of manual work every week. Highly recommended."</div>
              <div class="text-overline text-grey-5">— Mr. Kumara, English Hub</div>
            </q-carousel-slide>
            
            <q-carousel-slide name="4" class="column no-wrap flex-center q-px-md">
              <q-avatar size="80px" class="q-mb-md">
                 <img src="https://cdn.quasar.dev/img/avatar4.jpg">
              </q-avatar>
              <div class="testimonial-text text-white q-mb-md italic">"The white-label app gives our academy a professional edge. Students love the real-time tracking."</div>
              <div class="text-overline text-grey-5">— Dr. Fernando, Wisdom Institute</div>
            </q-carousel-slide>
          </q-carousel>
      </div>
    </section>

    <!-- Pricing Section -->
    <section class="section-padding">
       <div class="container-xl">
          <div class="text-center q-mb-xl">
             <q-badge outline color="white" label="FLEXIBLE PRICING" class="q-mb-md q-px-md q-py-xs letter-spacing-wide" rounded />
             <h2 class="text-h2 text-weight-bolder">Choose Your Plan</h2>
          </div>
          <div class="row q-col-gutter-xl justify-center">
            <!-- Lifetime Plan -->
            <div class="col-xs-12 col-sm-6 col-md-5">
              <div class="glass-card q-pa-xl rounded-borders h-full flex flex-center flex-column relative-position overflow-hidden border-indigo">
                <div class="absolute-top-right q-pa-md">
                   <q-badge color="indigo-10" label="LIFETIME ACCESS" class="q-pa-sm" />
                </div>
                <div class="text-h4 q-mb-md text-weight-bold">Enterprise Lifetime</div>
                <h2 class="text-h2 q-mb-md text-weight-bolder">
                   <span class="text-grey-7 text-strike text-h4 q-mr-sm">Rs. 45,000</span>
                   Rs. 40,000
                </h2>
                <p class="text-grey-5 q-mb-xl">One-time payment for perpetual access. Best for established institutes.</p>
                <q-list dense class="q-gutter-y-md q-mb-xl full-width">
                   <q-item v-for="item in ['All Core Modules', 'Unlimited Students', 'No Monthly Bills', 'Life-time Updates']" :key="item" class="q-px-none">
                      <q-item-section avatar min-width="24px"><q-icon name="check_circle" color="white" size="20px" /></q-item-section>
                      <q-item-section class="text-grey-3">{{ item }}</q-item-section>
                   </q-item>
                </q-list>
                <q-btn size="lg" color="white" text-color="black" label="Select Lifetime" to="/register" no-caps rounded class="full-width text-weight-bold" />
              </div>
            </div>
            <!-- Monthly Plan -->
            <div class="col-xs-12 col-sm-6 col-md-5">
              <div class="glass-card q-pa-xl rounded-borders h-full flex flex-center flex-column relative-position overflow-hidden">
                <div class="text-h4 q-mb-md text-weight-bold">Starter Monthly</div>
                <h2 class="text-h2 q-mb-md text-weight-bolder">Rs. 5,000</h2>
                <p class="text-grey-5 q-mb-xl">Low entry cost. Pay as you grow. Ideal for growing academies.</p>
                <q-list dense class="q-gutter-y-md q-mb-xl full-width">
                   <q-item v-for="item in ['All Core Modules', 'Monthly Billing', 'Cancel Anytime', 'Premium Support']" :key="item" class="q-px-none">
                      <q-item-section avatar min-width="24px"><q-icon name="check_circle" color="white" size="20px" /></q-item-section>
                      <q-item-section class="text-grey-3">{{ item }}</q-item-section>
                   </q-item>
                </q-list>
                <q-btn size="lg" outline color="white" label="Select Monthly" to="/register" no-caps rounded class="full-width text-weight-bold glass-button" />
              </div>
            </div>
          </div>
       </div>
    </section>

    <!-- Final CTA -->
    <section class="relative-position section-padding text-center overflow-hidden">
       <div class="absolute-full">
        <q-img 
          src="~assets/modern_classroom_dark_1767203250448.png" 
          class="fit" 
          style="opacity: 0.15; filter: grayscale(100%);"
        />
        <div class="absolute-full" style="background: radial-gradient(circle at center, transparent, #000 85%);"></div>
      </div>
      
      <div class="container-xl relative-position z-top q-py-xl">
        <h2 class="text-h2 q-mb-lg text-weight-bolder letter-spacing-tight">Ready to modernize?</h2>
        <p class="text-h6 text-grey-5 q-mb-xl opacity-70">Join the most advanced education platform on the market.</p>
        <q-btn 
          size="lg" 
          color="white" 
          text-color="black" 
          label="Join Now" 
          to="/register"
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
import { ref, onMounted } from 'vue'
import gsap from 'gsap'

const slide = ref('1')

onMounted(() => {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  

  tl.to('.hero-title', {
    y: 0,
    opacity: 1,
    duration: 0.8,
  }, '-=0.6')
  .to('.hero-subtitle', {
    y: 0,
    opacity: 1,
    duration: 0.8,
  }, '-=0.6')
  .to('.hero-btns', {
    y: 0,
    opacity: 1,
    duration: 0.8,
  }, '-=0.6')
  .to('.scroll-indicator', {
    y: 0,
    opacity: 1,
    duration: 0.8
  }, '-=0.4')
  
  // Continuous scroll animation
  gsap.to('.scroll-indicator', {
    y: 10,
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut'
  })
})

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
    title: 'White-Label App',
    description: 'Your own branded mobile experience for parents and high-achieving students.',
    icon: 'hub'
  }
]
</script>

<style scoped lang="scss">
.glass-button {
  backdrop-filter: blur(8px);
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
  &:hover {
    background: rgba(255,255,255,0.08);
  }
}

.animate-bounce {
  animation: bounce 2.5s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-8px);}
  60% {transform: translateY(-4px);}
}

.icon-container {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 24px;
}

.z-top {
  z-index: 10;
}

.inline-block {
  display: inline-block;
}

.flex-grow {
  flex-grow: 1;
}

.blur-3xl {
  filter: blur(64px);
}

@media (max-width: 600px) {
  .hero-title {
    font-size: 2.5rem !important;
    line-height: 1.1 !important;
  }
  
  .hero-subtitle {
    font-size: 1.1rem !important; 
    margin-bottom: 32px !important;
  }
  
  .glass-card {
    padding: 24px !important;
  }
  
  .full-width-sm {
    width: 100%;
  }

  .text-h2 {
      font-size: 2rem !important;
  }
}

@media (min-width: 1024px) {
  .text-md-left {
    text-align: left;
  }
  
  .justify-md-start {
    justify-content: flex-start;
  }
  
  .q-px-md-none {
      padding-left: 0 !important;
      padding-right: 0 !important;
  }
}

.border-indigo {
  border: 1px solid rgba(63, 81, 181, 0.4) !important;
  box-shadow: 0 0 30px rgba(63, 81, 181, 0.2);
}

.opacity-0 {
  opacity: 0;
}

.hero-title, .hero-subtitle, .hero-btns, .scroll-indicator {
  transform: translateY(30px);
}

.testimonial-carousel {
    height: 380px;
    @media (min-width: 600px) {
        height: 320px;
    }
}

.testimonial-text {
    font-size: 1.1rem;
    line-height: 1.6;
    max-width: 700px;
    @media (min-width: 600px) {
        font-size: 1.5rem;
    }
}
</style>
