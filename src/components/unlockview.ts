export interface UnlockViewOptions {
  onUnlock: (password: string) => Promise<void>;
}

export function UnlockView(options: UnlockViewOptions): HTMLElement {
  const section = document.createElement('section');
  section.className = 'unlock-card';
  section.innerHTML = `
    <div class="unlock-mark" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
    <p class="eyebrow">Encrypted private catalog</p>
    <h1>Sequencing Dataset Catalog</h1>
    <p>A curated index for GEO/SRA/ENA/TCGA datasets and publication-derived sequencing metadata.</p>
    <form class="unlock-form">
      <label>
        Password
        <input type="password" name="password" autocomplete="current-password" placeholder="Enter catalog password" required />
      </label>
      <button type="submit">Unlock catalog</button>
    </form>
    <p class="error" hidden></p>
  `;

  const form = section.querySelector<HTMLFormElement>('form')!;
  const error = section.querySelector<HTMLParagraphElement>('.error')!;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    const formData = new FormData(form);
    const password = String(formData.get('password') ?? '');
    try {
      await options.onUnlock(password);
    } catch {
      error.textContent = '密码错误或数据文件损坏';
      error.hidden = false;
    }
  });

  return section;
}
