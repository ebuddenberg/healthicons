import { useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import classnames from 'classnames';
import { searchKeywords } from '../../../../lib/searchKeywords';
import { TopBar } from '../../../../components/TopBar';
import { CategoryHeading } from '../../../../components/CategoryHeading';
import { IconTile } from '../../../../components/IconTile';
import { IconTileModal } from '../../../../components/IconTileModal';
import styles from '../../../index.module.scss';

import { getCategoriesAndIcons, Category, Icon } from '../../../../lib/icons';

interface ModalIcon {
  icon: Icon;
  iconType: string;
}

interface IconPageProps {
  categories: Category[];
  iconId?: string;
  style: 'outline' | 'filled';
  categoryId?: string;
}

export default function IconPage({
  iconId,
  categoryId,
  style,
  categories
}: IconPageProps) {
  const [modalIcon, setModalIcon] = useState<ModalIcon>(undefined);
  const [query, setQuery] = useState<string>();
  const [iconStyle, setIconStyle] =
    useState<'outline' | 'filled' | 'all'>('all');

  const router = useRouter();

  useMemo(() => {
    if (!iconId) {
      setModalIcon(undefined);
    }

    categories.forEach((category) => {
      category.icons.forEach((icon) => {
        if (icon.fileName === iconId && icon.path === categoryId) {
          setModalIcon({
            icon,
            iconType: style
          });
        }
      });
    });
  }, [categories, categoryId, iconId, style]);

  const iconsToRender = useMemo(() => {
    const filteredIcons: Icon[] = [];
    if (!query) {
      return filteredIcons;
    }

    categories.forEach((category) => {
      category.icons.forEach((icon) => {
        if (
          searchKeywords(
            query,
            icon.tags.concat([icon.title, category.title]).join(', ')
          )
        ) {
          filteredIcons.push(icon);
        }
      });
    });
    return filteredIcons;
  }, [query, categories]);

  const totalIconCount = categories.reduce((counter, category) => {
    return counter + category.icons.length;
  }, 0);

  return (
    <div className="container">
      <Head>
        <title>Health Icons</title>
        <link rel="icon" href="/favicon.ico" />

        <meta property="og:site_name" content="Health icons" />
        <meta property="og:title" content="Health icons" />
        <meta
          property="og:description"
          content="Free, open source health icons. Use in your next commercial or personal project. Editing is ok. Republishing is ok. No need to give credit."
        />
        <meta property="og:url" content="http://healthicons.org/" />
        <meta
          property="og:image"
          content="http://healthicons.org/og_image.png"
        />
        <meta
          property="og:image:secure_url"
          content="https://healthicons.org/og_image.png"
        />
        <meta property="og:image:width" content="1280" />
        <meta property="og:image:height" content="640" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:image"
          content="https://healthicons.org/og_image.png"
        />
        <meta property="twitter:site" content="@health_icons" />
      </Head>

      <TopBar />
      <main id="main">
        <div className={styles.box}>
          <h1 className="mt-2">Free, open source health icons</h1>
          <h3>
            Free for use in your next commercial or personal project.
            <span> </span>
            Editing is ok. Republishing is ok. No need to give credit.
          </h3>
        </div>
        <label className={styles.filterBox}>
          <input
            type="text"
            className={styles.filterBoxInput}
            placeholder={`Search ${totalIconCount * 2} icons…`}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div className={styles.styleToggleContainer}>
          <button
            className={classnames(styles.styleToggle, {
              [styles.styleToggleSelected]: iconStyle === 'all'
            })}
            onClick={() => {
              setIconStyle('all');
            }}
          >
            <img
              src="/icons/svg/outline/symbols/yes.svg"
              width="20"
              height="20"
              alt=""
            />
            All
          </button>
          <button
            className={classnames(styles.styleToggle, {
              [styles.styleToggleSelected]: iconStyle === 'filled'
            })}
            onClick={() => {
              setIconStyle('filled');
            }}
          >
            <img
              src="/icons/svg/outline/symbols/yes.svg"
              width="20"
              height="20"
              alt=""
            />
            Filled
          </button>
          <button
            className={classnames(styles.styleToggle, {
              [styles.styleToggleSelected]: iconStyle === 'outline'
            })}
            onClick={() => {
              setIconStyle('outline');
            }}
          >
            <img
              src="/icons/svg/outline/symbols/yes.svg"
              width="20"
              height="20"
              alt=""
            />
            Outline
          </button>
        </div>

        {categories.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            {(!query ||
              category.icons.some((icon) => {
                return iconsToRender.includes(icon);
              })) && <CategoryHeading>{category.title}</CategoryHeading>}
            <div className={styles.iconGrid}>
              {category.icons.map((icon, iconIndex) => (
                <IconTile
                  key={iconIndex}
                  icon={icon}
                  iconStyle={iconStyle}
                  visible={!query || iconsToRender.includes(icon)}
                  onClick={(iconType: string) => {
                    router.push(
                      `/icon/${iconStyle}/${icon.path}/${icon.fileName}`,
                      undefined,
                      {
                        shallow: true
                      }
                    );
                  }}
                />
              ))}
            </div>
          </div>
        ))}
        {modalIcon && (
          <IconTileModal
            icon={modalIcon.icon}
            iconType={modalIcon.iconType}
            isOpen={modalIcon !== undefined}
            onClose={() => {
              router.push('/', undefined, {
                shallow: true
              });
            }}
          />
        )}
      </main>
      <footer>
        All icons are licensed under an open source{' '}
        <a href="/about#license" className={styles.link}>
          MIT License
        </a>
      </footer>
    </div>
  );
}

export async function getStaticProps({
  params: { iconId, categoryId, style }
}) {
  const categories = await getCategoriesAndIcons();
  return { props: { iconId, categoryId, style, categories } };
}

export async function getStaticPaths() {
  const categories = await getCategoriesAndIcons();
  const allIcons = categories.flatMap((category) => {
    return category.icons;
  });

  const allPaths = [];
  allIcons.forEach((icon) => {
    allPaths.push({
      params: { style: 'filled', categoryId: icon.path, iconId: icon.fileName }
    });

    allPaths.push({
      params: { style: 'outline', categoryId: icon.path, iconId: icon.fileName }
    });
  });

  return {
    paths: allPaths,
    fallback: false
  };
}
