<template>
  <q-page class="bg-black text-white q-py-xl">
    <div class="container-xl q-px-md">
      <div class="glass-card q-pa-xl rounded-borders">
        <h1 class="text-h3 text-weight-bolder q-mb-xl text-gradient">Privacy Policy</h1>
        
        <div class="text-grey-4 q-gutter-y-lg">
          <section>
            <h2 class="text-h5 text-white text-weight-bold q-mb-md">1. Information We Collect</h2>
            <p>We collect information you provide directly to us when you create an account, use our services, or communicate with us. This may include your name, email address, phone number, and any other information you choose to provide.</p>
          </section>

          <section>
            <h2 class="text-h5 text-white text-weight-bold q-mb-md">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, to process your transactions, and to communicate with you about products, services, offers, and events.</p>
          </section>

          <section>
            <h2 class="text-h5 text-white text-weight-bold q-mb-md">3. Data Security</h2>
            <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
          </section>

          <section>
            <h2 class="text-h5 text-white text-weight-bold q-mb-md">4. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at superadmin@classmastertms.com.</p>
          </section>
        </div>

        <div class="q-mt-xl">
          <q-btn flat color="white" label="Back to Home" to="/" icon="arrow_back" no-caps />
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped lang="scss">
.glass-card {
  padding: 60px;
  @media (max-width: 600px) {
    padding: 30px;
  }
}

p {
  margin-bottom: 24px;
}
</style>
