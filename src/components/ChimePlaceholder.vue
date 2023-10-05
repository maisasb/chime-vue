<template>
  <div class="placeholder-container">
    <p class="placeholder-container__message">
      Para participar libere o acesso à sua câmera e microfone pelo navegador
    </p>
  </div>
</template>

<style>
.placeholder-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 492px;
  background-color: #ccc;
  border-radius: 16px;
}
.placeholder-container__message {
  color: #fff;
  font-size: 16px;
  padding: 16px;
}

.placeholder-container__icon {
  margin: 24px;
  color: #c123dd;
  transform: scale(2.5);
}
</style>
