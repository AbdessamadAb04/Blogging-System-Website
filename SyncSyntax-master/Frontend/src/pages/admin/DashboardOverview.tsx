import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FolderOpen, Users, TrendingUp, BarChart3, PieChart, LineChart, Activity, Star, BarChart2 } from 'lucide-react';

interface DashboardStats {
  totalPosts: number;
  totalCategories: number;
  activeUsers: number;
  totalComments: number;
}

interface StatCard {
  id: string;
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: string;
  chartType: ChartType;
}

type ChartType = 'line' | 'pie' | 'bar' | 'area';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<ChartType>('bar');
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    totalCategories: 0,
    activeUsers: 0,
    totalComments: 0,
  });

  // Centralized chart dimensions to keep consistent width/height across all charts
  const CHART_WIDTH = 1130;
  const CHART_HEIGHT = 400;

  const [postsData, setPostsData] = useState<any[]>([]);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [newsletterData, setNewsletterData] = useState<any[]>([]);
  const [engagementMonthly, setEngagementMonthly] = useState<any[]>([]);

  useEffect(() => {
    // Fetch dashboard statistics from API
    const fetchStats = async () => {
      try {
        // Fetch both posts and categories in parallel using relative API paths
        // count=999 ensures we get all posts for accurate dashboard stats
        const [postsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/postsapi?count=999&includeDrafts=true'),
          fetch('/api/postsapi/categories')
        ]);

        // Safely parse JSON only when the response is OK and content-type is JSON
        const posts = (postsResponse.ok && (postsResponse.headers.get('content-type') || '').includes('application/json'))
          ? await postsResponse.json()
          : [];

        const categories = (categoriesResponse.ok && (categoriesResponse.headers.get('content-type') || '').includes('application/json'))
          ? await categoriesResponse.json()
          : [];

        setPostsData(posts || []);
        setCategoriesData(categories || []);

        // Calculate stats
        setStats({
          totalPosts: posts.length || 0,
          totalCategories: categories.length || 0,
          activeUsers: 12, // TODO: Fetch from users API
          totalComments: 48, // TODO: Fetch from comments API
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Set default values on error
        setStats({
          totalPosts: 0,
          totalCategories: 0,
          activeUsers: 0,
          totalComments: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Fetch newsletter data separately
    const fetchNewsletter = async () => {
      try {
        const response = await fetch('/api/newsletterapi');
        if (!response.ok || !(response.headers.get('content-type') || '').includes('application/json')) {
          console.error('Newsletter API error or non-JSON response:', response.status);
          setNewsletterData([]);
          return;
        }
        const data = await response.json();
        // Ensure data is an array
        if (Array.isArray(data)) {
          setNewsletterData(data);
        } else {
          console.error('Newsletter API returned non-array data:', data);
          setNewsletterData([]);
        }
      } catch (error) {
        console.error('Error fetching newsletter data:', error);
        setNewsletterData([]);
      }
    };

    fetchNewsletter();
    // Fetch server-side monthly engagement (likes/comments) if provided
    const fetchEngagement = async () => {
      try {
        const resp = await fetch('/api/analytics/engagement-monthly');
        if (!resp.ok) return;
        const d = await resp.json();
        if (Array.isArray(d)) setEngagementMonthly(d);
      } catch (err) {
        console.error('Error fetching engagement-monthly:', err);
      }
    };

    fetchEngagement();
  }, []);

  // Calculate current month posts
  const currentMonthPosts = postsData.filter((post: any) => {
    if (!post.createdAt) return false;
    const postDate = new Date(post.createdAt);
    const now = new Date();
    return postDate.getMonth() === now.getMonth() &&
      postDate.getFullYear() === now.getFullYear();
  }).length;

  // Calculate total engagement (likes and comments) across all time
  const totalEngagementData = postsData.reduce((acc: { likes: number, comments: number }, post: any) => {
    const likes = Number(post.likeCount || 0);
    const comments = Number(post.commentCount || 0);
    return { likes: acc.likes + likes, comments: acc.comments + comments };
  }, { likes: 0, comments: 0 });

  const totalEngagementScore = totalEngagementData.likes + totalEngagementData.comments;

  // Calculate current month engagement (likes and comments).
  // Prefer server-provided `engagementMonthly` (accurate by event timestamp).
  let currentMonthEngagement = { likes: 0, comments: 0 };
  if (engagementMonthly && engagementMonthly.length > 0) {
    const last = engagementMonthly[engagementMonthly.length - 1];
    currentMonthEngagement = { likes: Number(last.likes || 0), comments: Number(last.comments || 0) };
  } else {
    // Fallback: approximate by summing per-post totals for posts published this month
    currentMonthEngagement = postsData.reduce((acc: { likes: number, comments: number }, post: any) => {
      if (!post.createdAt) return acc;
      const postDate = new Date(post.createdAt);
      const now = new Date();
      if (postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear()) {
        const likes = Number(post.likeCount || 0);
        const comments = Number(post.commentCount || 0);
        return { likes: acc.likes + likes, comments: acc.comments + comments };
      }
      return acc;
    }, { likes: 0, comments: 0 });
  }


  // Calculate newsletter conversion variance from real data
  const newsletterMonthlyData: number[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthCount = newsletterData.filter((sub: any) => {
      if (!sub.subscribedAt) return false;
      const subDate = new Date(sub.subscribedAt);
      return subDate.getMonth() === targetDate.getMonth() &&
        subDate.getFullYear() === targetDate.getFullYear();
    }).length;
    newsletterMonthlyData.push(monthCount);
  }

  const totalNewsletterConversions = newsletterMonthlyData.reduce((sum, val) => sum + val, 0);
  const avgMonthlyConversions = totalNewsletterConversions > 0 ? totalNewsletterConversions / 12 : 0;
  const currentMonthConversions = newsletterMonthlyData[newsletterMonthlyData.length - 1] || 0;

  // Conversion Variance Formula: (Cm - A) / A * 100
  const conversionVariance = avgMonthlyConversions > 0
    ? ((currentMonthConversions - avgMonthlyConversions) / avgMonthlyConversions) * 100
    : 0;

  // Calculate top category by engagement for Category Distribution card
  const categoryEngagementStats = categoriesData.map((cat: any) => {
    const likes = Number(cat.likeCount || 0);
    const comments = Number(cat.commentCount || 0);
    return { category: cat.name, engagement: likes + comments };
  });

  const topCategoryByEngagement = categoryEngagementStats.length > 0 && categoryEngagementStats.some(c => c.engagement > 0)
    ? categoryEngagementStats.reduce((max, item) => item.engagement > max.engagement ? item : max, categoryEngagementStats[0])
    : { category: '-', engagement: 0 };


  const statCards: StatCard[] = [
    {
      id: 'posts',
      title: 'Blogs Activity',
      value: stats.totalPosts,
      icon: BarChart3,
      color: 'bg-blue-500',
      trend: `${currentMonthPosts} blog posts`,
      chartType: 'bar'
    },
    {
      id: 'categories',
      title: 'Category Distribution',
      value: stats.totalCategories,
      icon: PieChart,
      color: 'bg-green-500',
      trend: topCategoryByEngagement.category,
      chartType: 'pie'
    },
    {
      id: 'engagement',
      title: 'Blogs Engagement',
      value: totalEngagementScore,
      icon: Activity,
      color: 'bg-orange-500',
      trend: `${currentMonthEngagement.likes} likes ${currentMonthEngagement.comments} comnts`,
      chartType: 'area'
    },
    {
      id: 'newsletter',
      title: 'Newsletter Conversion',
      value: newsletterData.length,
      icon: LineChart,
      color: 'bg-purple-500',
      trend: `${conversionVariance >= 0 ? '+' : ''}${conversionVariance.toFixed(1)}% c-variance`,
      chartType: 'line'
    },
  ];

  // Chart rendering functions
  const renderLineChart = () => {
    const now = new Date();
    const newsletterChartData = [];
    const xPositions = [100, 190, 280, 370, 460, 550, 640, 730, 820, 910, 1000, 1090];

    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' }) + " '" + String(targetDate.getFullYear()).slice(-2);

      const conversions = newsletterData.filter((sub: any) => {
        if (!sub.subscribedAt) return false;
        const subDate = new Date(sub.subscribedAt);
        return subDate.getMonth() === targetDate.getMonth() &&
          subDate.getFullYear() === targetDate.getFullYear();
      }).length;

      newsletterChartData.push({ month: monthName, conversions, x: xPositions[11 - i] });
    }

    const maxConversions = Math.max(...newsletterChartData.map(d => d.conversions), 1);
    const chartHeight = CHART_HEIGHT;
    const chartWidth = CHART_WIDTH;

    return (
      <div className="w-full bg-purple-100 rounded-lg p-6">
        <div className="w-full flex justify-center">
          <div className="relative bg-white rounded-lg p-4 shadow-sm">
            <svg width={chartWidth} height={chartHeight + 40} className="block">
              {/* Y-axis */}
              <line x1="30" y1="20" x2="30" y2={chartHeight} stroke="#9CA3AF" strokeWidth="1" />

              {/* X-axis */}
              <line x1="30" y1={chartHeight} x2={chartWidth - 20} y2={chartHeight} stroke="#9CA3AF" strokeWidth="1" />

              {/* Y-axis labels */}
              {(() => {
                const yMax = Math.ceil(maxConversions / 5) * 5 || 5;
                const step = yMax / 4;
                const yLabels = [0, step, step * 2, step * 3, yMax];
                return yLabels.map((value) => {
                  const y = chartHeight - (value / yMax) * (chartHeight - 20);
                  return (
                    <g key={value}>
                      <line x1="25" y1={y} x2="30" y2={y} stroke="#9CA3AF" strokeWidth="1" />
                      <text x="20" y={y + 4} textAnchor="end" className="text-xs fill-gray-600">{Math.round(value)}</text>
                    </g>
                  );
                });
              })()}

              {/* Grid lines */}
              {(() => {
                const yMax = Math.ceil(maxConversions / 5) * 5 || 5;
                const step = yMax / 4;
                const yLabels = [0, step, step * 2, step * 3, yMax];
                return yLabels.map((value) => {
                  const y = chartHeight - (value / yMax) * (chartHeight - 20);
                  return (
                    <line key={value} x1="30" y1={y} x2={chartWidth - 20} y2={y} stroke="#F3F4F6" strokeWidth="1" />
                  );
                });
              })()}

              {/* Data line */}
              <polyline
                points={newsletterChartData.map(d => {
                  const x = d.x;
                  const y = chartHeight - (d.conversions / maxConversions) * (chartHeight - 40);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {newsletterChartData.map((d, i) => {
                const x = d.x;
                const y = chartHeight - (d.conversions / maxConversions) * (chartHeight - 40);
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="#8B5CF6" />
                    <circle cx={x} cy={y} r="2" fill="white" />
                    {/* Value labels */}
                    <text x={x} y={y - 10} textAnchor="middle" className="text-xs fill-purple-600 font-medium">
                      {d.conversions}
                    </text>
                  </g>
                );
              })}

              {/* X-axis labels */}
              {newsletterChartData.map((d, i) => (
                <text key={i} x={d.x} y={chartHeight + 15} textAnchor="middle" className="text-xs fill-gray-600">
                  {d.month}
                </text>
              ))}
            </svg>

            {/* Chart summary */}
            <div className="mt-4 grid grid-cols-4 gap-4 text-center border-t pt-4">
              <div>
                <div className="text-lg font-semibold text-purple-600">{newsletterChartData.reduce((sum, d) => sum + d.conversions, 0)}</div>
                <div className="text-xs text-gray-600">Total Conversions</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">{Math.max(...newsletterChartData.map(d => d.conversions))}</div>
                <div className="text-xs text-gray-600">Peak Month</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600">{Math.min(...newsletterChartData.map(d => d.conversions))}</div>
                <div className="text-xs text-gray-600">Lowest Month</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-600">{(newsletterChartData.reduce((sum, d) => sum + d.conversions, 0) / newsletterChartData.length).toFixed(1)}</div>
                <div className="text-xs text-gray-600">Avg/Month</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    // Only use real data from database - no fallback
    const categories = categoriesData || [];
    const colors = ['#10B981', '#34D399', '#059669', '#6EE7B7', '#16A34A'];

    const categoryPostsData = categories.map((cat: any, i: number) => {
      return {
        label: cat.name,
        value: Number(cat.postCount || 0),
        color: colors[i % colors.length]
      };
    });

    const categoryEngagementData = categories.map((cat: any, i: number) => {
      const likes = Number(cat.likeCount || 0);
      const comments = Number(cat.commentCount || 0);
      return {
        label: cat.name,
        value: likes + comments,
        color: colors[i % colors.length]
      };
    });

    const chartHeight = CHART_HEIGHT;
    const chartWidth = CHART_WIDTH;

    const totalPosts = categoryPostsData.reduce((s, d) => s + d.value, 0);
    const totalEngagement = categoryEngagementData.reduce((s, d) => s + d.value, 0);

    // Compute panel and svg widths so the two-panel group matches the width of the other single charts
    const panelGap = 32; // gap between panels in px (matches tailwind gap-8)
    const innerPadding = 16; // p-4 -> 16px
    const panelTotalWidth = chartWidth + innerPadding * 2; // match single-chart total width (svg + 2*padding)
    const svgInnerWidth = Math.max(200, Math.floor((chartWidth - 2 * innerPadding - panelGap) / 2));
    const panelWidth = svgInnerWidth + innerPadding * 2; // panel container width includes svg + left/right padding

    return (
      <div className="w-full bg-green-100 rounded-lg p-6">
        {/* Center the two-panel group and lock its total width to chartWidth */}
        <div style={{ width: panelTotalWidth }} className="mx-auto flex flex-col lg:flex-row gap-8 justify-center">
          {/* Left: Posts distribution */}
          <div style={{ width: panelWidth }} className="relative bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-2"><span className="inline-block w-2 h-2 bg-[#333333] rounded-full mr-2 align-middle relative" style={{ top: '-2px' }} />Category Distribution per <span className="text-green-600 font-semibold">Blog Posts</span></h3>
            {
              // Prepare proportional donut segments for posts
            }
            {(() => {
              const radius = 100;
              const thickness = 25;
              const cx = svgInnerWidth / 2;
              const cy = chartHeight / 2;
              const circumference = 2 * Math.PI * radius;
              let acc = 0;
              const segments = categoryPostsData.map((d) => {
                const portion = totalPosts > 0 ? d.value / totalPosts : 0;
                const len = Math.max(0, portion * circumference);
                const seg = { ...d, len, offset: acc, portion };
                acc += len;
                return seg;
              });

              return (
                <svg width={svgInnerWidth} height={chartHeight + 40} className="block mx-auto">
                  {totalPosts === 0 ? (
                    // Empty state: gray circle
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill="none"
                      stroke="#D1D5DB"
                      strokeWidth={thickness}
                    />
                  ) : (
                    segments.map((s, i) => {
                      if (s.len <= 0) return null;
                      const dash = `${s.len} ${Math.max(0, circumference - s.len)}`;
                      // compute midpoint angle for label placement
                      const mid = s.offset + s.len / 2;
                      const midAngle = (mid / circumference) * Math.PI * 2 - Math.PI / 2; // account for rotate(-90)
                      const labelRadius = radius + thickness / 2 + 14; // distance from center for label
                      const lx = cx + labelRadius * Math.cos(midAngle);
                      const ly = cy + labelRadius * Math.sin(midAngle);
                      const anchor = Math.cos(midAngle) > 0.2 ? 'start' : Math.cos(midAngle) < -0.2 ? 'end' : 'middle';
                      return (
                        <g key={`posts-seg-${i}`}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={radius}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={thickness}
                            strokeDasharray={dash}
                            strokeDashoffset={-s.offset}
                            transform={`rotate(-90 ${cx} ${cy})`}
                            strokeLinecap="butt"
                          >
                            <title>{`${s.label}: ${s.value} (${(s.portion * 100).toFixed(1)}%)`}</title>
                          </circle>
                          <text x={lx} y={ly - 8} textAnchor={anchor} className="text-xs fill-gray-600" dominantBaseline="central">
                            {s.label}
                          </text>
                          <text x={lx} y={ly + 8} textAnchor={anchor} className="text-sm fill-gray-700 font-medium" dominantBaseline="central">
                            {(s.portion * 100).toFixed(1) + '%'}
                          </text>
                        </g>
                      );
                    })
                  )}
                  {/* center label removed in favor of panel heading */}
                </svg>
              );
            })()}
            <div className="mt-4 grid grid-cols-2 gap-4 text-left">
              {[...categoryPostsData].sort((a, b) => b.value - a.value).map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <div style={{ backgroundColor: d.color }} className="w-3 h-3 rounded-full" />
                  <div className="text-sm text-gray-700">{d.label}</div>
                  <div className="ml-auto text-sm font-medium text-gray-800">{d.value}<span className="text-xs font-normal text-gray-600 ml-1">blogs</span></div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-3 text-sm text-gray-600">Top category: <span className="font-semibold text-gray-800">{categoryPostsData.length > 0 && categoryPostsData.some(d => d.value > 0) ? categoryPostsData.reduce((max, d) => d.value > max.value ? d : max, categoryPostsData[0])?.label : '-'}</span></div>
          </div>

          {/* Right: Engagement distribution */}
          <div style={{ width: panelWidth }} className="relative bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-2"><span className="inline-block w-2 h-2 bg-[#333333] rounded-full mr-2 align-middle relative" style={{ top: '-2px' }} />Category Distribution per <span className="text-green-600 font-semibold">Engagement</span></h3>
            {
              // Prepare proportional donut segments for engagement
            }
            {(() => {
              const radius = 100;
              const thickness = 25;
              const cx = svgInnerWidth / 2;
              const cy = chartHeight / 2;
              const circumference = 2 * Math.PI * radius;
              let acc = 0;
              const segments = categoryEngagementData.map((d) => {
                const portion = totalEngagement > 0 ? d.value / totalEngagement : 0;
                const len = Math.max(0, portion * circumference);
                const seg = { ...d, len, offset: acc, portion };
                acc += len;
                return seg;
              });

              return (
                <svg width={svgInnerWidth} height={chartHeight + 40} className="block mx-auto">
                  {totalEngagement === 0 ? (
                    // Empty state: gray circle
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill="none"
                      stroke="#D1D5DB"
                      strokeWidth={thickness}
                    />
                  ) : (
                    segments.map((s, i) => {
                      if (s.len <= 0) return null;
                      const dash = `${s.len} ${Math.max(0, circumference - s.len)}`;
                      const mid = s.offset + s.len / 2;
                      const midAngle = (mid / circumference) * Math.PI * 2 - Math.PI / 2;
                      const labelRadius = radius + thickness / 2 + 14;
                      const lx = cx + labelRadius * Math.cos(midAngle);
                      const ly = cy + labelRadius * Math.sin(midAngle);
                      const anchor = Math.cos(midAngle) > 0.2 ? 'start' : Math.cos(midAngle) < -0.2 ? 'end' : 'middle';
                      return (
                        <g key={`eng-seg-${i}`}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={radius}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={thickness}
                            strokeDasharray={dash}
                            strokeDashoffset={-s.offset}
                            transform={`rotate(-90 ${cx} ${cy})`}
                            strokeLinecap="butt"
                          >
                            <title>{`${s.label}: ${s.value} (${(s.portion * 100).toFixed(1)}%)`}</title>
                          </circle>
                          <text x={lx} y={ly - 8} textAnchor={anchor} className="text-xs fill-gray-600" dominantBaseline="central">
                            {s.label}
                          </text>
                          <text x={lx} y={ly + 8} textAnchor={anchor} className="text-sm fill-gray-700 font-medium" dominantBaseline="central">
                            {(s.portion * 100).toFixed(1) + '%'}
                          </text>
                        </g>
                      );
                    })
                  )}
                  {/* center label removed in favor of panel heading */}
                </svg>
              );
            })()}
            <div className="mt-4 grid grid-cols-2 gap-4 text-left">
              {[...categoryEngagementData].sort((a, b) => b.value - a.value).map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <div style={{ backgroundColor: d.color }} className="w-3 h-3 rounded-full" />
                  <div className="text-sm text-gray-700">{d.label}</div>
                  <div className="ml-auto text-sm font-medium text-gray-800">{d.value}e</div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Top category: <span className="font-semibold text-gray-800">{categoryEngagementData.length > 0 && categoryEngagementData.some(d => d.value > 0) ? categoryEngagementData.reduce((max, d) => d.value > max.value ? d : max, categoryEngagementData[0])?.label : '-'}</span></div>
                <div className="text-xs font-normal text-gray-600">e(engagements) = Σ blog posts ( likes + comments )</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    // Generate last 12 months
    const now = new Date();
    const monthlyData = [];
    const xPositions = [100, 190, 280, 370, 460, 550, 640, 730, 820, 910, 1000, 1090];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' }) + " '" + String(date.getFullYear()).slice(-2);

      // Count posts for this month
      const postsCount = postsData.filter((post: any) => {
        if (!post.createdAt) return false;
        const postDate = new Date(post.createdAt);
        return postDate.getMonth() === date.getMonth() &&
          postDate.getFullYear() === date.getFullYear();
      }).length;

      monthlyData.push({
        month: monthName,
        posts: postsCount,
        x: xPositions[11 - i]
      });
    }

    const maxPosts = Math.max(...monthlyData.map(d => d.posts), 1); // Ensure at least 1 for scaling
    const chartHeight = CHART_HEIGHT;
    const chartWidth = CHART_WIDTH;

    return (
      <div className="w-full bg-blue-100 rounded-lg p-6">
        <div className="w-full flex justify-center">
          <div className="relative bg-white rounded-lg p-4 shadow-sm">
            <svg width={chartWidth} height={chartHeight + 40} className="block">
              {/* Y-axis */}
              <line x1="30" y1="20" x2="30" y2={chartHeight} stroke="#9CA3AF" strokeWidth="1" />

              {/* X-axis */}
              <line x1="30" y1={chartHeight} x2={chartWidth - 20} y2={chartHeight} stroke="#9CA3AF" strokeWidth="1" />

              {/* Y-axis labels */}
              {(() => {
                const yMax = Math.ceil(maxPosts / 5) * 5 || 5; // Round up to nearest 5
                const step = yMax / 4;
                const yLabels = [0, step, step * 2, step * 3, yMax];
                return yLabels.map((value) => {
                  const y = chartHeight - (value / yMax) * (chartHeight - 20);
                  return (
                    <g key={value}>
                      <line x1="25" y1={y} x2="30" y2={y} stroke="#9CA3AF" strokeWidth="1" />
                      <text x="20" y={y + 4} textAnchor="end" className="text-xs fill-gray-600">{Math.round(value)}</text>
                    </g>
                  );
                });
              })()}

              {/* Grid lines */}
              {(() => {
                const yMax = Math.ceil(maxPosts / 5) * 5 || 5;
                const step = yMax / 4;
                const yLabels = [0, step, step * 2, step * 3, yMax];
                return yLabels.map((value) => {
                  const y = chartHeight - (value / yMax) * (chartHeight - 20);
                  return (
                    <line key={value} x1="30" y1={y} x2={chartWidth - 20} y2={y} stroke="#F3F4F6" strokeWidth="1" />
                  );
                });
              })()}

              {/* Bar chart */}
              {monthlyData.map((d, i) => {
                const x = d.x - 15;
                const barHeight = (d.posts / maxPosts) * (chartHeight - 40);
                const y = chartHeight - barHeight;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width="30" height={barHeight} fill="#3B82F6" rx="2" />
                    <text x={d.x} y={y - 10} textAnchor="middle" className="text-xs fill-blue-600 font-medium">
                      {d.posts}
                    </text>
                  </g>
                );
              })}

              {/* X-axis labels */}
              {monthlyData.map((d, i) => (
                <text key={i} x={d.x} y={chartHeight + 15} textAnchor="middle" className="text-xs fill-gray-600">
                  {d.month}
                </text>
              ))}
            </svg>

            {/* Chart summary */}
            <div className="mt-4 grid grid-cols-4 gap-4 text-center border-t pt-4">
              <div>
                <div className="text-lg font-semibold text-blue-600">{monthlyData.reduce((sum, d) => sum + d.posts, 0)}</div>
                <div className="text-xs text-gray-600">Total Posts</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">{Math.max(...monthlyData.map(d => d.posts))}</div>
                <div className="text-xs text-gray-600">Peak Month</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600">{Math.min(...monthlyData.map(d => d.posts))}</div>
                <div className="text-xs text-gray-600">Lowest Month</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-600">{(monthlyData.reduce((sum, d) => sum + d.posts, 0) / monthlyData.length).toFixed(1)}</div>
                <div className="text-xs text-gray-600">Avg/Month</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAreaChart = () => {
    // Generate last 12 months with actual engagement data.
    // Prefer server-provided monthly engagement (likes/comments) when available.
    const now = new Date();
    let engagementData: any[] = [];
    const xPositions = [100, 190, 280, 370, 460, 550, 640, 730, 820, 910, 1000, 1090];

    if (engagementMonthly && engagementMonthly.length > 0) {
      // engagementMonthly expected: [{ month: 'yyyy-MM', label: 'Dec 25', likes: n, comments: m }, ...]
      engagementData = engagementMonthly.map((d: any, idx: number) => ({
        month: d.label || d.month,
        likes: Number(d.likes || 0),
        comments: Number(d.comments || 0),
        x: xPositions[idx] ?? (100 + idx * 90)
      }));
    } else {
      // Fallback: bucket by post publication date (legacy behavior)
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' }) + " '" + String(date.getFullYear()).slice(-2);

        const monthEngagement = postsData.reduce((acc: { likes: number, comments: number }, post: any) => {
          if (!post.createdAt) return acc;
          const postDate = new Date(post.createdAt);
          if (postDate.getMonth() === date.getMonth() && postDate.getFullYear() === date.getFullYear()) {
            const likes = Number(post.likeCount || 0);
            const comments = Number(post.commentCount || 0);
            return { likes: acc.likes + likes, comments: acc.comments + comments };
          }
          return acc;
        }, { likes: 0, comments: 0 });

        engagementData.push({
          month: monthName,
          likes: monthEngagement.likes,
          comments: monthEngagement.comments,
          x: xPositions[11 - i]
        });
      }
    }

    const maxLikes = Math.max(...engagementData.map(d => d.likes), 1);
    const maxComments = Math.max(...engagementData.map(d => d.comments), 1);
    const maxValue = Math.max(maxLikes, maxComments);
    const chartHeight = CHART_HEIGHT;
    const chartWidth = CHART_WIDTH;

    return (
      <div className="w-full bg-orange-100 rounded-lg p-6">
        <div className="w-full flex justify-center">
          <div className="relative bg-white rounded-lg p-4 shadow-sm">
            <svg width={chartWidth} height={chartHeight + 40} className="block">
              {/* Y-axis */}
              <line x1="30" y1="20" x2="30" y2={chartHeight} stroke="#9CA3AF" strokeWidth="1" />

              {/* X-axis */}
              <line x1="30" y1={chartHeight} x2={chartWidth - 20} y2={chartHeight} stroke="#9CA3AF" strokeWidth="1" />

              {/* Y-axis labels */}
              {(() => {
                const yMax = Math.ceil(maxValue / 5) * 5 || 5;
                const step = yMax / 4;
                const yLabels = [0, step, step * 2, step * 3, yMax];
                return yLabels.map((value) => {
                  const y = chartHeight - (value / yMax) * (chartHeight - 20);
                  return (
                    <g key={value}>
                      <line x1="25" y1={y} x2="30" y2={y} stroke="#9CA3AF" strokeWidth="1" />
                      <text x="20" y={y + 4} textAnchor="end" className="text-xs fill-gray-600">
                        {value >= 1000 ? (value / 1000).toFixed(1) + 'K' : Math.round(value)}
                      </text>
                    </g>
                  );
                });
              })()}

              {/* Grid lines */}
              {(() => {
                const yMax = Math.ceil(maxValue / 5) * 5 || 5;
                const step = yMax / 4;
                const yLabels = [0, step, step * 2, step * 3, yMax];
                return yLabels.map((value) => {
                  const y = chartHeight - (value / yMax) * (chartHeight - 20);
                  return (
                    <line key={value} x1="30" y1={y} x2={chartWidth - 20} y2={y} stroke="#F3F4F6" strokeWidth="1" />
                  );
                });
              })()}

              {/* Likes line */}
              <polyline
                points={engagementData.map(d => {
                  const x = d.x;
                  const y = chartHeight - (d.likes / maxValue) * (chartHeight - 40);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Comments line */}
              <polyline
                points={engagementData.map(d => {
                  const x = d.x;
                  const y = chartHeight - (d.comments / maxValue) * (chartHeight - 40);
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#F97316"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Likes data points */}
              {engagementData.map((d, i) => {
                const x = d.x;
                const y = chartHeight - (d.likes / maxValue) * (chartHeight - 40);
                return (
                  <g key={`likes-${i}`}>
                    <circle cx={x} cy={y} r="4" fill="#3B82F6" />
                    <circle cx={x} cy={y} r="2" fill="white" />
                    <text x={x} y={y - 10} textAnchor="middle" className="text-xs fill-blue-600 font-medium">
                      {d.likes >= 1000 ? (d.likes / 1000).toFixed(1) + 'K' : d.likes}
                    </text>
                  </g>
                );
              })}

              {/* Comments data points */}
              {engagementData.map((d, i) => {
                const x = d.x;
                const y = chartHeight - (d.comments / maxValue) * (chartHeight - 40);
                return (
                  <g key={`comments-${i}`}>
                    <circle cx={x} cy={y} r="4" fill="#F97316" />
                    <circle cx={x} cy={y} r="2" fill="white" />
                    <text x={x} y={y + 20} textAnchor="middle" className="text-xs fill-orange-600 font-medium">
                      {d.comments >= 1000 ? (d.comments / 1000).toFixed(1) + 'K' : d.comments}
                    </text>
                  </g>
                );
              })}

              {/* X-axis labels */}
              {engagementData.map((d, i) => (
                <text key={i} x={d.x} y={chartHeight + 15} textAnchor="middle" className="text-xs fill-gray-600">
                  {d.month}
                </text>
              ))}
            </svg>

            {/* Chart summary */}
            <div className="mt-4 border-t pt-4">
              {/* Legend */}
              <div className="flex justify-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Likes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Comments</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-orange-600">
                    {totalEngagementScore >= 1000 ? (totalEngagementScore / 1000).toFixed(1) + 'K' : totalEngagementScore}
                  </div>
                  <div className="text-xs text-gray-600">Total Engagement (e)</div>
                </div>
                <div>
                  <div className="text-lg font-semibold flex items-center justify-center gap-1">
                    <span className="text-blue-600">
                      {(() => {
                        const monthTotals = engagementData.map(d => d.likes + d.comments);
                        const peakIndex = monthTotals.indexOf(Math.max(...monthTotals));
                        const val = engagementData[peakIndex].likes;
                        return val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val;
                      })()}
                    </span>
                    <span className="text-gray-400">-</span>
                    <span className="text-orange-600">
                      {(() => {
                        const monthTotals = engagementData.map(d => d.likes + d.comments);
                        const peakIndex = monthTotals.indexOf(Math.max(...monthTotals));
                        const val = engagementData[peakIndex].comments;
                        return val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val;
                      })()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">Peak Month</div>
                </div>
                <div>
                  <div className="text-lg font-semibold flex items-center justify-center gap-1">
                    <span className="text-blue-600">
                      {(() => {
                        const monthTotals = engagementData.map(d => d.likes + d.comments);
                        const lowestIndex = monthTotals.indexOf(Math.min(...monthTotals));
                        const val = engagementData[lowestIndex].likes;
                        return val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val;
                      })()}
                    </span>
                    <span className="text-gray-400">-</span>
                    <span className="text-orange-600">
                      {(() => {
                        const monthTotals = engagementData.map(d => d.likes + d.comments);
                        const lowestIndex = monthTotals.indexOf(Math.min(...monthTotals));
                        const val = engagementData[lowestIndex].comments;
                        return val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val;
                      })()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">Lowest Month</div>
                </div>
                <div>
                  <div className="text-lg font-semibold flex items-center justify-center gap-1">
                    <span className="text-blue-600">
                      {(() => {
                        const avgLikes = engagementData.reduce((sum, d) => sum + d.likes, 0) / engagementData.length;
                        const val = Math.round(avgLikes);
                        return val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val;
                      })()}
                    </span>
                    <span className="text-gray-400">-</span>
                    <span className="text-orange-600">
                      {(() => {
                        const avgComments = engagementData.reduce((sum, d) => sum + d.comments, 0) / engagementData.length;
                        const val = Math.round(avgComments);
                        return val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val;
                      })()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">Avg Month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (selectedChart) {
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'bar':
        return renderBarChart();
      case 'area':
        return renderAreaChart();
      default:
        return renderLineChart();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="animate-pulse bg-gray-200 h-8 w-48 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#333333]">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your blog.</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Separator Line */}
      <hr className="w-full border-t border-gray-200" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const isSelected = selectedChart === card.chartType;
          const getBorderColor = () => {
            switch (card.color) {
              case 'bg-blue-500': return isSelected ? 'border-blue-500' : 'border-gray-200 hover:border-blue-500';
              case 'bg-green-500': return isSelected ? 'border-green-500' : 'border-gray-200 hover:border-green-500';
              case 'bg-purple-500': return isSelected ? 'border-purple-500' : 'border-gray-200 hover:border-purple-500';
              case 'bg-orange-500': return isSelected ? 'border-orange-500' : 'border-gray-200 hover:border-orange-500';
              default: return isSelected ? 'border-blue-500' : 'border-gray-200 hover:border-blue-500';
            }
          };
          return (
            <div
              key={index}
              onClick={() => setSelectedChart(card.chartType)}
              className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-300 cursor-pointer ${getBorderColor()}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-[#333333]">{card.value.toLocaleString()}</p>
                  {card.trend && (
                    <p className={`text-sm mt-1 flex items-center gap-1 ${card.color === 'bg-blue-500' ? 'text-blue-600' :
                      card.color === 'bg-orange-500' ? 'text-orange-600' :
                        card.color === 'bg-purple-500' ? 'text-purple-600' :
                          card.color === 'bg-green-500' ? 'text-green-600' :
                            'text-green-600'
                      }`}>
                      {card.color === 'bg-blue-500' && <BarChart2 className="w-3.5 h-3.5" />}
                      {card.color === 'bg-orange-500' && <TrendingUp className="w-3 h-3" />}
                      {card.color === 'bg-purple-500' && <TrendingUp className="w-3 h-3" />}
                      {card.color === 'bg-green-500' && <Star className="w-3 h-3 fill-green-600" />}
                      {card.trend}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${isSelected ? card.color : card.color + ' bg-opacity-10'}`}>
                  <Icon className={`w-6 h-6 ${isSelected
                    ? 'text-white'
                    : card.color.replace('bg-', 'text-')
                    }`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Chart Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[#333333]">Analytics Overview</h2>
          </div>
          <div className="mt-2 sm:mt-0">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${statCards.find(card => card.chartType === selectedChart)?.color || 'bg-gray-500'
              }`}>
              {statCards.find(card => card.chartType === selectedChart)?.title || 'Chart'}
            </span>
          </div>
        </div>

        {/* Chart Container with Transition */}
        <div className="transition-all duration-500 ease-in-out">
          {renderChart()}
        </div>

        {/* Data Period Information */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Data Period:</span> All time-relative datasets in the above charts represent the last 12 months of activity.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-[#333333] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/create-blog-post')}
            className="p-4 bg-[#0077B6] text-white rounded-lg hover:bg-[#005f8f] transition-colors flex items-center gap-3"
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Add New Blog Post</span>
          </button>
          <button
            onClick={() => navigate('/admin/create-category')}
            className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-3"
          >
            <FolderOpen className="w-5 h-5" />
            <span className="font-medium">Add New Category</span>
          </button>
          <button
            onClick={() => navigate('/admin/create-author')}
            className="p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-3"
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Add New Author</span>
          </button>
          <button
            onClick={() => navigate('/admin/create-user')}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-3"
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Add New User</span>
          </button>
        </div>
      </div>

    </div>
  );
}