# Cafe24 자동 배포 설정

`main` 브랜치의 `landing-template` 폴더가 변경되면 GitHub Actions가 Cafe24에 자동으로 업로드합니다.

## 처음 한 번만 설정할 항목

GitHub 저장소의 **Settings → Environments → New environment**에서 `production` 환경을 만듭니다.

`production`의 **Environment secrets**에 다음 네 값을 등록합니다.

| 이름 | 입력할 값 |
| --- | --- |
| `CAFE24_FTP_SERVER` | Cafe24 FTP 서버 주소 |
| `CAFE24_FTP_USERNAME` | Cafe24 FTP 아이디 |
| `CAFE24_FTP_PASSWORD` | Cafe24 FTP 비밀번호 |
| `CAFE24_FTP_SERVER_DIR` | 실제 사이트 폴더. 끝에 `/`가 필요함 |

현재 운영 주소가 `/hillstate-suwon/`이므로 일반적인 Cafe24 구조에서는 서버 폴더가 `/www/hillstate-suwon/`일 가능성이 높습니다. Cafe24 FTP에서 실제 폴더를 확인한 뒤 정확한 값을 등록해야 합니다.

## 첫 배포

1. GitHub 저장소의 **Actions** 탭을 엽니다.
2. **Deploy to Cafe24**를 선택합니다.
3. **Run workflow**를 눌러 첫 배포를 실행합니다.
4. 성공 후 `https://www.bunyanghouse.com/hillstate-suwon/`에서 변경 내용을 확인합니다.

그다음부터는 `main` 브랜치의 `landing-template` 파일을 변경해 푸시할 때 자동으로 배포됩니다.

배포 작업은 서버 폴더 전체를 강제로 비우지 않으며, 접속 정보나 서버 폴더가 누락되면 업로드 전에 중단됩니다.
