# React Best Practices Skill

> Vercel Engineering의 React/Next.js 성능 최적화 가이드라인 (45개 규칙, 8개 카테고리)
>
> 출처: https://github.com/vercel-labs/agent-skills

## 적용 시점

- 새 React 컴포넌트/Next.js 페이지 작성 시
- 데이터 페칭 구현 시
- 성능 이슈 코드 리뷰 시
- 번들 크기/로드 시간 최적화 시

---

## 1. 워터폴 제거 (Critical) `async-`

> **워터폴은 성능 저하의 #1 원인** - 순차적 await 연산은 네트워크 지연을 누적시킴

### 규칙 1-1: await 지연 (Defer await)

await를 실제 필요한 시점까지 미룸

```typescript
// ❌ 잘못됨: 불필요하게 일찍 await
async function Page({ params }) {
  const data = await fetchData(params.id);
  if (!params.showDetails) {
    return <Summary />;
  }
  return <Details data={data} />;
}

// ✅ 올바름: 필요한 시점에만 await
async function Page({ params }) {
  if (!params.showDetails) {
    return <Summary />;
  }
  const data = await fetchData(params.id);
  return <Details data={data} />;
}
```

### 규칙 1-2: Promise.all로 병렬화

독립적인 작업은 동시에 실행

```typescript
// ❌ 잘못됨: 순차 실행 (워터폴)
async function fetchAllData() {
  const user = await fetchUser();     // 200ms
  const posts = await fetchPosts();   // 300ms
  const comments = await fetchComments(); // 200ms
  return { user, posts, comments };   // 총 700ms
}

// ✅ 올바름: 병렬 실행
async function fetchAllData() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(),     // 200ms
    fetchPosts(),    // 300ms
    fetchComments()  // 200ms
  ]);
  return { user, posts, comments };  // 총 300ms (가장 느린 것 기준)
}
```

### 규칙 1-3: 컴포넌트 합성으로 병렬화

각 컴포넌트가 독립적으로 데이터 페칭

```tsx
// ❌ 잘못됨: 부모에서 모든 데이터를 순차 페칭
async function Dashboard() {
  const user = await fetchUser();
  const stats = await fetchStats();
  return (
    <div>
      <UserCard user={user} />
      <StatsPanel stats={stats} />
    </div>
  );
}

// ✅ 올바름: 각 컴포넌트가 자체 데이터 페칭 (자동 병렬화)
async function Dashboard() {
  return (
    <div>
      <Suspense fallback={<UserSkeleton />}>
        <UserCard />  {/* 내부에서 fetchUser() */}
      </Suspense>
      <Suspense fallback={<StatsSkeleton />}>
        <StatsPanel />  {/* 내부에서 fetchStats() */}
      </Suspense>
    </div>
  );
}
```

### 규칙 1-4: Suspense로 레이아웃 언블로킹

느린 데이터가 전체 페이지를 블로킹하지 않도록 함

```tsx
// ❌ 잘못됨: 느린 API가 전체 페이지 렌더링 블로킹
async function Page() {
  const slowData = await fetchSlowData(); // 3초 대기
  return (
    <Layout>
      <Header />
      <SlowComponent data={slowData} />
    </Layout>
  );
}

// ✅ 올바름: Suspense로 점진적 렌더링
async function Page() {
  return (
    <Layout>
      <Header />
      <Suspense fallback={<Loading />}>
        <SlowComponent />  {/* 내부에서 await */}
      </Suspense>
    </Layout>
  );
}
```

---

## 2. 번들 최적화 (Critical) `bundle-`

### 규칙 2-1: Barrel Import 금지

barrel 파일(`index.ts`)을 통한 import는 수천 개의 미사용 모듈을 로드

```typescript
// ❌ 잘못됨: barrel import (전체 라이브러리 로드)
import { Button } from '@/components';
import { format } from 'date-fns';
import { debounce } from 'lodash';

// ✅ 올바름: 직접 import (필요한 모듈만 로드)
import { Button } from '@/components/ui/button';
import format from 'date-fns/format';
import debounce from 'lodash/debounce';
```

### 규칙 2-2: Next.js optimizePackageImports 설정

barrel import가 불가피할 때 Next.js 설정으로 최적화

```typescript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'lodash',
    ],
  },
};
```

### 규칙 2-3: Dynamic Import로 무거운 컴포넌트 지연 로드

초기 번들에서 무거운 컴포넌트 분리

```tsx
// ❌ 잘못됨: 정적 import (항상 번들에 포함)
import { Editor } from '@/components/editor';
import { Chart } from 'chart.js';

function Page() {
  return showEditor ? <Editor /> : <Preview />;
}

// ✅ 올바름: dynamic import (필요할 때만 로드)
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@/components/editor'), {
  loading: () => <EditorSkeleton />,
  ssr: false,  // 클라이언트에서만 필요한 경우
});

const Chart = dynamic(() => import('chart.js').then(mod => mod.Chart));

function Page() {
  return showEditor ? <Editor /> : <Preview />;
}
```

### 규칙 2-4: 조건부 모듈 로딩

특정 조건에서만 필요한 모듈은 동적 로드

```typescript
// ❌ 잘못됨: 항상 로드
import { analytics } from 'heavy-analytics-lib';

function trackEvent(event) {
  if (process.env.NODE_ENV === 'production') {
    analytics.track(event);
  }
}

// ✅ 올바름: 조건부 로드
async function trackEvent(event) {
  if (process.env.NODE_ENV === 'production') {
    const { analytics } = await import('heavy-analytics-lib');
    analytics.track(event);
  }
}
```

### 규칙 2-5: 서드파티 라이브러리 하이드레이션 후 로드

크리티컬하지 않은 라이브러리는 하이드레이션 이후 로드

```tsx
'use client';

import { useEffect, useState } from 'react';

function Analytics() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 하이드레이션 완료 후 로드
    import('analytics-lib').then((mod) => {
      mod.init();
      setIsLoaded(true);
    });
  }, []);

  return isLoaded ? <AnalyticsDashboard /> : null;
}
```

---

## 3. 서버 성능 (High) `server-`

### 규칙 3-1: React.cache()로 요청 단위 중복 제거

동일 요청 내에서 같은 함수 호출 캐싱

```typescript
import { cache } from 'react';

// ❌ 잘못됨: 매번 새로 페칭
async function getUser(id: string) {
  return await db.user.findUnique({ where: { id } });
}

// ✅ 올바름: 요청 단위로 캐싱 (같은 요청 내 중복 호출 방지)
const getUser = cache(async (id: string) => {
  return await db.user.findUnique({ where: { id } });
});

// 같은 요청 내에서 여러 번 호출해도 DB 쿼리는 1번만 실행
async function Page() {
  const user = await getUser('123');  // DB 쿼리 실행
  return <UserProfile user={user} />;
}

async function UserProfile({ user }) {
  const sameUser = await getUser('123');  // 캐시에서 반환
  return <div>{sameUser.name}</div>;
}
```

### 규칙 3-2: LRU 캐시로 요청 간 캐싱

여러 요청에 걸쳐 데이터 재사용

```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 100,           // 최대 항목 수
  ttl: 1000 * 60 * 5, // 5분 TTL
});

async function getExpensiveData(key: string) {
  const cached = cache.get(key);
  if (cached) return cached;

  const data = await fetchExpensiveData(key);
  cache.set(key, data);
  return data;
}
```

### 규칙 3-3: unstable_cache로 Next.js 캐싱

Next.js의 빌트인 캐싱 활용

```typescript
import { unstable_cache } from 'next/cache';

const getCachedUser = unstable_cache(
  async (id: string) => {
    return await db.user.findUnique({ where: { id } });
  },
  ['user-cache'],  // 캐시 키
  {
    revalidate: 3600,  // 1시간마다 재검증
    tags: ['users'],   // 태그 기반 무효화
  }
);
```

### 규칙 3-4: RSC에서 클라이언트로 전달 데이터 최소화

필요한 필드만 선택하여 직렬화 비용 절감

```tsx
// ❌ 잘못됨: 전체 객체 전달 (불필요한 직렬화)
async function Page() {
  const user = await getUser();  // { id, name, email, password, createdAt, ... }
  return <ClientComponent user={user} />;
}

// ✅ 올바름: 필요한 필드만 전달
async function Page() {
  const user = await getUser();
  return (
    <ClientComponent
      user={{ id: user.id, name: user.name }}
    />
  );
}
```

### 규칙 3-5: 병렬 데이터 페칭

서버 컴포넌트에서 여러 데이터 소스 병렬 처리

```tsx
async function Dashboard() {
  // ❌ 잘못됨: 순차 실행
  const user = await getUser();
  const orders = await getOrders(user.id);
  const notifications = await getNotifications(user.id);

  // ✅ 올바름: 의존성 있는 것은 순차, 없는 것은 병렬
  const user = await getUser();
  const [orders, notifications] = await Promise.all([
    getOrders(user.id),
    getNotifications(user.id),
  ]);

  return <DashboardView user={user} orders={orders} notifications={notifications} />;
}
```

---

## 4. 클라이언트 페칭 (Medium-High) `client-`

### 규칙 4-1: SWR로 자동 중복 제거 및 캐싱

클라이언트 데이터 페칭에 SWR 사용

```tsx
'use client';

import useSWR from 'swr';

// ❌ 잘못됨: useEffect + useState (수동 관리)
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Loading />;
  if (error) return <Error />;
  return <Profile user={user} />;
}

// ✅ 올바름: SWR 사용 (자동 캐싱, 재검증, 중복 제거)
function UserProfile({ userId }) {
  const { data: user, error, isLoading } = useSWR(
    `/api/users/${userId}`,
    fetcher
  );

  if (isLoading) return <Loading />;
  if (error) return <Error />;
  return <Profile user={user} />;
}

// SWR fetcher
const fetcher = (url: string) => fetch(url).then(res => res.json());
```

### 규칙 4-2: SWR 전역 설정

공통 설정으로 일관된 동작 보장

```tsx
// app/providers.tsx
import { SWRConfig } from 'swr';

export function Providers({ children }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url) => fetch(url).then(res => res.json()),
        revalidateOnFocus: false,     // 포커스 시 재검증 비활성화
        dedupingInterval: 2000,       // 2초 내 중복 요청 방지
        errorRetryCount: 3,           // 에러 시 3회 재시도
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

### 규칙 4-3: 조건부 페칭

필요할 때만 데이터 페칭

```tsx
function UserPosts({ userId, showPosts }) {
  // showPosts가 false면 요청하지 않음
  const { data: posts } = useSWR(
    showPosts ? `/api/users/${userId}/posts` : null,
    fetcher
  );

  if (!showPosts) return null;
  return <PostList posts={posts} />;
}
```

---

## 5. 리렌더 최적화 (Medium) `rerender-`

### 규칙 5-1: Functional setState로 의존성 제거

state 업데이트 시 현재 값에 의존하는 경우

```tsx
// ❌ 잘못됨: count를 의존성에 포함해야 함
function Counter() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount(count + 1);  // count가 바뀔 때마다 함수 재생성
  }, [count]);

  return <ExpensiveChild onClick={increment} />;
}

// ✅ 올바름: functional update로 의존성 제거
function Counter() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount(prev => prev + 1);  // 의존성 없음, 함수 재사용
  }, []);

  return <ExpensiveChild onClick={increment} />;
}
```

### 규칙 5-2: startTransition으로 비긴급 업데이트 분리

긴급한 UI 업데이트와 비긴급 업데이트 분리

```tsx
import { useState, useTransition } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    // 입력값은 즉시 반영 (긴급)
    setQuery(e.target.value);

    // 검색 결과는 비긴급으로 처리
    startTransition(() => {
      setResults(searchFor(e.target.value));
    });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <ResultList results={results} />}
    </>
  );
}
```

### 규칙 5-3: useDeferredValue로 값 지연

무거운 계산의 입력값 지연

```tsx
import { useDeferredValue, useMemo } from 'react';

function SearchResults({ query }) {
  // query가 빠르게 바뀌어도 deferredQuery는 지연됨
  const deferredQuery = useDeferredValue(query);

  // 무거운 필터링은 지연된 값으로 실행
  const filteredItems = useMemo(
    () => items.filter(item => item.name.includes(deferredQuery)),
    [deferredQuery]
  );

  return (
    <ul style={{ opacity: query !== deferredQuery ? 0.5 : 1 }}>
      {filteredItems.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}
```

### 규칙 5-4: 메모이제이션 적절히 사용

실제 성능 문제가 있을 때만 memo 사용

```tsx
// ❌ 잘못됨: 불필요한 메모이제이션 (오버헤드만 증가)
const SimpleButton = memo(({ onClick, label }) => (
  <button onClick={onClick}>{label}</button>
));

// ✅ 올바름: 무거운 컴포넌트만 메모이제이션
const ExpensiveChart = memo(({ data }) => {
  // 복잡한 렌더링 로직
  return <canvas>{/* ... */}</canvas>;
});

// ✅ 비용이 큰 계산만 useMemo
const sortedData = useMemo(
  () => data.sort((a, b) => a.value - b.value),
  [data]
);
```

### 규칙 5-5: 상태 분리로 리렌더 범위 축소

관련 없는 상태는 분리

```tsx
// ❌ 잘못됨: 모든 상태가 하나의 객체에
function Form() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    isSubmitting: false,
    errors: {},
  });
  // name만 바뀌어도 전체 리렌더
}

// ✅ 올바름: 독립적인 상태 분리
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // name 변경은 name 관련 컴포넌트만 리렌더
}
```

---

## 6. 렌더링 성능 (Medium) `rendering-`

### 규칙 6-1: content-visibility로 뷰포트 외 요소 최적화

긴 리스트에서 보이지 않는 요소 렌더링 스킵

```tsx
// 스타일 정의
const styles = `
  .list-item {
    content-visibility: auto;
    contain-intrinsic-size: 0 80px;  /* 예상 높이 */
  }
`;

function LongList({ items }) {
  return (
    <>
      <style>{styles}</style>
      <ul>
        {items.map(item => (
          <li key={item.id} className="list-item">
            <ItemContent item={item} />
          </li>
        ))}
      </ul>
    </>
  );
}
```

### 규칙 6-2: 정적 JSX 호이스팅

변하지 않는 JSX는 컴포넌트 밖으로 이동

```tsx
// ❌ 잘못됨: 매 렌더마다 새 객체 생성
function Card({ title, children }) {
  return (
    <div className="card">
      <div className="card-header">
        <svg>{/* 복잡한 아이콘 */}</svg>
      </div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

// ✅ 올바름: 정적 요소 호이스팅
const CardIcon = (
  <div className="card-header">
    <svg>{/* 복잡한 아이콘 */}</svg>
  </div>
);

function Card({ title, children }) {
  return (
    <div className="card">
      {CardIcon}  {/* 재사용되는 정적 요소 */}
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### 규칙 6-3: 하이드레이션 불일치 방지

서버/클라이언트 렌더링 일관성 유지

```tsx
// ❌ 잘못됨: 하이드레이션 불일치 발생
function Timestamp() {
  return <span>{new Date().toISOString()}</span>;  // 서버/클라이언트 시간 다름
}

// ✅ 올바름: useEffect로 클라이언트에서만 동적 값 설정
function Timestamp() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    setTime(new Date().toISOString());
  }, []);

  return <span>{time ?? 'Loading...'}</span>;
}

// ✅ 또는: 인라인 스크립트로 초기화 (플리커 방지)
function ThemeProvider({ children }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.documentElement.dataset.theme =
              localStorage.getItem('theme') || 'light';
          `,
        }}
      />
      {children}
    </>
  );
}
```

### 규칙 6-4: SVG 최적화

인라인 SVG 대신 컴포넌트나 스프라이트 사용

```tsx
// ❌ 잘못됨: 복잡한 인라인 SVG 반복
function Icons() {
  return (
    <>
      <svg>...</svg>
      <svg>...</svg>
    </>
  );
}

// ✅ 올바름: SVG 컴포넌트로 분리 + memo
const Icon = memo(({ name, ...props }) => {
  const icons = {
    home: <path d="..." />,
    user: <path d="..." />,
  };

  return (
    <svg {...props}>
      {icons[name]}
    </svg>
  );
});
```

---

## 7. JavaScript 성능 (Low-Medium) `js-`

### 규칙 7-1: Set/Map으로 효율적 검색

배열 대신 Set/Map 사용으로 O(1) 검색

```typescript
// ❌ 잘못됨: 배열에서 O(n) 검색
const selectedIds = [1, 2, 3, 4, 5];
const isSelected = selectedIds.includes(id);  // O(n)

const users = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
const user = users.find(u => u.id === targetId);  // O(n)

// ✅ 올바름: Set/Map으로 O(1) 검색
const selectedIds = new Set([1, 2, 3, 4, 5]);
const isSelected = selectedIds.has(id);  // O(1)

const userMap = new Map(users.map(u => [u.id, u]));
const user = userMap.get(targetId);  // O(1)
```

### 규칙 7-2: 인덱스 맵 미리 구축

반복 검색이 필요한 경우 인덱스 맵 생성

```typescript
// ❌ 잘못됨: 매번 find 호출
function processOrders(orders, users) {
  return orders.map(order => ({
    ...order,
    user: users.find(u => u.id === order.userId),  // 각 주문마다 O(n)
  }));
}

// ✅ 올바름: 인덱스 맵으로 한 번에 검색
function processOrders(orders, users) {
  const userIndex = new Map(users.map(u => [u.id, u]));

  return orders.map(order => ({
    ...order,
    user: userIndex.get(order.userId),  // O(1)
  }));
}
```

### 규칙 7-3: toSorted/toReversed로 불변성 유지

원본 배열을 변경하지 않는 메서드 사용

```typescript
// ❌ 잘못됨: sort()는 원본 배열 변경
function SortedList({ items }) {
  const sorted = items.sort((a, b) => a.name.localeCompare(b.name));
  // items 배열이 변경됨! React 상태 오염 가능
  return <ul>{sorted.map(/* ... */)}</ul>;
}

// ✅ 올바름: toSorted()는 새 배열 반환 (ES2023)
function SortedList({ items }) {
  const sorted = items.toSorted((a, b) => a.name.localeCompare(b.name));
  // items 원본 유지
  return <ul>{sorted.map(/* ... */)}</ul>;
}

// toReversed(), toSpliced()도 동일
const reversed = items.toReversed();
const spliced = items.toSpliced(1, 1, newItem);
```

### 규칙 7-4: 프로퍼티 접근 캐싱

반복문 내 깊은 프로퍼티 접근 캐싱

```typescript
// ❌ 잘못됨: 매 반복마다 프로퍼티 체인 접근
function processItems(data) {
  return data.response.items.map(item => ({
    value: item.nested.deeply.value * data.response.config.multiplier,
  }));
}

// ✅ 올바름: 프로퍼티 접근 캐싱
function processItems(data) {
  const { items } = data.response;
  const { multiplier } = data.response.config;

  return items.map(item => {
    const { value } = item.nested.deeply;
    return { value: value * multiplier };
  });
}
```

### 규칙 7-5: DOM 스타일 일괄 변경

여러 스타일 변경을 한 번에 처리

```typescript
// ❌ 잘못됨: 여러 번의 스타일 변경 (리플로우 다발)
element.style.width = '100px';
element.style.height = '100px';
element.style.margin = '10px';

// ✅ 올바름: cssText로 일괄 변경 또는 클래스 토글
element.style.cssText = 'width: 100px; height: 100px; margin: 10px;';
// 또는
element.classList.add('box-style');
```

---

## 8. 고급 패턴 (Low) `advanced-`

### 규칙 8-1: useLatest로 최신 값 참조

콜백에서 항상 최신 값 참조

```typescript
// useLatest 훅 구현
function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

// 사용 예시
function ChatRoom({ roomId, onMessage }) {
  const latestRoomId = useLatest(roomId);
  const latestOnMessage = useLatest(onMessage);

  useEffect(() => {
    const connection = createConnection();

    connection.on('message', (msg) => {
      // 항상 최신 roomId와 onMessage 참조
      if (msg.roomId === latestRoomId.current) {
        latestOnMessage.current(msg);
      }
    });

    return () => connection.disconnect();
  }, []);  // 의존성 배열 비움 - 재연결 방지

  return <Messages roomId={roomId} />;
}
```

### 규칙 8-2: Callback Ref로 요소 생명주기 관리

DOM 요소 마운트/언마운트 시 정리 로직

```tsx
function AutoFocusInput() {
  // ❌ 잘못됨: useRef + useEffect 조합
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} />;

  // ✅ 올바름: callback ref
  const inputRef = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.focus();
    }
  }, []);

  return <input ref={inputRef} />;
}
```

### 규칙 8-3: Ref 핸들러로 외부 라이브러리 연동

외부 라이브러리 인스턴스 관리

```tsx
function MapComponent({ center, zoom }) {
  const mapRef = useRef<MapLibrary | null>(null);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node && !mapRef.current) {
      // 마운트: 라이브러리 초기화
      mapRef.current = new MapLibrary(node, { center, zoom });
    }

    if (!node && mapRef.current) {
      // 언마운트: 정리
      mapRef.current.destroy();
      mapRef.current = null;
    }
  }, []);  // 초기화 시점의 값만 사용

  // props 변경 시 업데이트
  useEffect(() => {
    mapRef.current?.setCenter(center);
  }, [center]);

  useEffect(() => {
    mapRef.current?.setZoom(zoom);
  }, [zoom]);

  return <div ref={containerRef} className="map-container" />;
}
```

### 규칙 8-4: 커스텀 훅으로 로직 재사용

반복되는 패턴을 훅으로 추출

```typescript
// useDebounce 훅
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// useMediaQuery 훅
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
```

---

## 우선순위 요약

| 우선순위 | 카테고리 | 영향도 | 접두사 |
|---------|---------|--------|--------|
| 1 | 워터폴 제거 | **CRITICAL** | `async-` |
| 2 | 번들 최적화 | **CRITICAL** | `bundle-` |
| 3 | 서버 성능 | HIGH | `server-` |
| 4 | 클라이언트 페칭 | MEDIUM-HIGH | `client-` |
| 5 | 리렌더 최적화 | MEDIUM | `rerender-` |
| 6 | 렌더링 성능 | MEDIUM | `rendering-` |
| 7 | JS 성능 | LOW-MEDIUM | `js-` |
| 8 | 고급 패턴 | LOW | `advanced-` |

## 체크리스트

코드 리뷰 시 확인:

- [ ] Promise.all로 병렬화할 수 있는 await가 있는가?
- [ ] barrel import를 직접 import로 바꿀 수 있는가?
- [ ] 무거운 컴포넌트에 dynamic import를 적용했는가?
- [ ] React.cache()로 중복 페칭을 방지했는가?
- [ ] SWR/React Query를 클라이언트 페칭에 사용하는가?
- [ ] functional setState로 불필요한 의존성을 제거했는가?
- [ ] 긴 리스트에 content-visibility를 적용했는가?
- [ ] Set/Map으로 검색 성능을 최적화했는가?
